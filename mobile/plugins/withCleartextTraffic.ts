import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from "expo/config-plugins";
import fs from "fs";
import path from "path";

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

type Props = {
  /** Path (relative to mobile/) to the network security config xml file. */
  networkSecurityConfigPath?: string;
};

const DEFAULT_XML_PATH = "assets/network_security_config.xml";

const withCleartextTraffic: ConfigPlugin<Props | void> = (config, props) => {
  const xmlPath = props?.networkSecurityConfigPath ?? DEFAULT_XML_PATH;

  config = withAndroidManifest(config, (mod) => {
    const app = getMainApplicationOrThrow(mod.modResults);
    app.$["android:usesCleartextTraffic"] = "true";
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return mod;
  });

  config = withDangerousMod(config, [
    "android",
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const sourceFile = path.join(projectRoot, xmlPath);
      const destDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "xml",
      );
      const destFile = path.join(destDir, "network_security_config.xml");

      if (!fs.existsSync(sourceFile)) {
        throw new Error(
          `Missing network security config at ${sourceFile}. Expected ${xmlPath}.`,
        );
      }

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(sourceFile, destFile);

      return mod;
    },
  ]);

  return config;
};

export default withCleartextTraffic;
