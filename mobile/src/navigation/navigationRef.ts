import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<any>();

export const navigate = (name: string, params?: any) => {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  }
};
