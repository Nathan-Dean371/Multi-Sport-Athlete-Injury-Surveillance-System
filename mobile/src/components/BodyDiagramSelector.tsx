import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import Svg, {
  G,
  Circle,
  Rect,
  Path,
  Line,
  Ellipse,
  Text as SvgText,
} from "react-native-svg";
import { BodyPart, Side } from "../types/injury.types";

interface BodyDiagramSelectorProps {
  selectedBodyPart?: BodyPart;
  selectedSide?: Side;
  onBodyPartSelect: (bodyPart: BodyPart) => void;
  onSideSelect: (side: Side) => void;
}

interface Zone {
  id: string;
  label: string;
  bodyPart: BodyPart;
  side: Side;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angle: number;
}

const zones: Zone[] = [
  {
    id: "head",
    label: "Head",
    bodyPart: BodyPart.HEAD,
    side: Side.CENTRAL,
    cx: 150,
    cy: 45,
    rx: 32,
    ry: 32,
    angle: 0,
  },
  {
    id: "chest",
    label: "Chest",
    bodyPart: BodyPart.CHEST,
    side: Side.CENTRAL,
    cx: 150,
    cy: 110,
    rx: 45,
    ry: 35,
    angle: 0,
  },
  {
    id: "abdomen",
    label: "Abdomen",
    bodyPart: BodyPart.ABDOMEN,
    side: Side.CENTRAL,
    cx: 150,
    cy: 180,
    rx: 42,
    ry: 35,
    angle: 0,
  },
  {
    id: "left-shoulder",
    label: "L. Shoulder",
    bodyPart: BodyPart.SHOULDER,
    side: Side.LEFT,
    cx: 105,
    cy: 95,
    rx: 20,
    ry: 20,
    angle: 0,
  },
  {
    id: "right-shoulder",
    label: "R. Shoulder",
    bodyPart: BodyPart.SHOULDER,
    side: Side.RIGHT,
    cx: 195,
    cy: 95,
    rx: 20,
    ry: 20,
    angle: 0,
  },
  {
    id: "left-upper-arm",
    label: "L. Arm",
    bodyPart: BodyPart.UPPER_ARM,
    side: Side.LEFT,
    cx: 85,
    cy: 140,
    rx: 22,
    ry: 45,
    angle: 23,
  },
  {
    id: "right-upper-arm",
    label: "R. Arm",
    bodyPart: BodyPart.UPPER_ARM,
    side: Side.RIGHT,
    cx: 215,
    cy: 140,
    rx: 22,
    ry: 45,
    angle: -23,
  },
  {
    id: "left-lower-arm",
    label: "L. Forearm",
    bodyPart: BodyPart.FOREARM,
    side: Side.LEFT,
    cx: 50,
    cy: 222,
    rx: 20,
    ry: 45,
    angle: 22,
  },
  {
    id: "right-lower-arm",
    label: "R. Forearm",
    bodyPart: BodyPart.FOREARM,
    side: Side.RIGHT,
    cx: 250,
    cy: 222,
    rx: 20,
    ry: 45,
    angle: -22,
  },
  {
    id: "left-upper-leg",
    label: "L. Thigh",
    bodyPart: BodyPart.THIGH,
    side: Side.LEFT,
    cx: 125,
    cy: 275,
    rx: 24,
    ry: 65,
    angle: 9,
  },
  {
    id: "right-upper-leg",
    label: "R. Thigh",
    bodyPart: BodyPart.THIGH,
    side: Side.RIGHT,
    cx: 175,
    cy: 275,
    rx: 24,
    ry: 65,
    angle: -9,
  },
  {
    id: "left-lower-leg",
    label: "L. Calf",
    bodyPart: BodyPart.LOWER_LEG,
    side: Side.LEFT,
    cx: 100,
    cy: 407,
    rx: 22,
    ry: 65,
    angle: 9,
  },
  {
    id: "right-lower-leg",
    label: "R. Calf",
    bodyPart: BodyPart.LOWER_LEG,
    side: Side.RIGHT,
    cx: 200,
    cy: 407,
    rx: 22,
    ry: 65,
    angle: -9,
  },
];

export default function BodyDiagramSelector({
  selectedBodyPart,
  selectedSide,
  onBodyPartSelect,
  onSideSelect,
}: BodyDiagramSelectorProps) {
  const handleZonePress = (zone: Zone) => {
    onBodyPartSelect(zone.bodyPart);
    onSideSelect(zone.side);
  };

  const isZoneSelected = (zone: Zone) => {
    return selectedBodyPart === zone.bodyPart && selectedSide === zone.side;
  };

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 300 500" style={styles.svg}>
        {/* BASE BODY DRAWING (Segmented style) */}
        <G fill="#9CA3AF" stroke="#9CA3AF">
          {/* Head & Neck */}
          <Circle cx="150" cy="45" r="22" />
          <Rect x="142" y="65" width="16" height="20" strokeWidth="0" />

          {/* Shoulders */}
          <Circle cx="105" cy="95" r="16" />
          <Circle cx="195" cy="95" r="16" />

          {/* Torso */}
          <Rect x="120" y="90" width="60" height="45" strokeWidth="0" />
          <Path
            d="M 120 140 L 180 140 L 180 195 L 165 210 L 135 210 L 120 195 Z"
            strokeWidth="0"
          />

          {/* Limbs (Using thick lines for crisp joints) */}
          <G strokeWidth="26" strokeLinecap="butt">
            <Line x1="100" y1="105" x2="70" y2="175" />
            <Line x1="65" y1="185" x2="35" y2="260" />

            <Line x1="200" y1="105" x2="230" y2="175" />
            <Line x1="235" y1="185" x2="265" y2="260" />

            <Line x1="135" y1="215" x2="115" y2="335" />
            <Line x1="110" y1="345" x2="90" y2="470" />

            <Line x1="165" y1="215" x2="185" y2="335" />
            <Line x1="190" y1="345" x2="210" y2="470" />
          </G>
        </G>

        {/* Little red decorative dot */}
        <Circle cx="50" cy="450" r="2" fill="red" />

        {/* INTERACTIVE MAPPED ZONES */}
        {zones.map((zone) => {
          const isActive = isZoneSelected(zone);

          return (
            <G key={zone.id}>
              <Ellipse
                cx={zone.cx}
                cy={zone.cy}
                rx={zone.rx}
                ry={zone.ry}
                rotation={zone.angle}
                origin={`${zone.cx}, ${zone.cy}`}
                fill={isActive ? "rgba(192, 132, 252, 0.3)" : "transparent"}
                stroke={isActive ? "#A855F7" : "#BAE6FD"}
                strokeWidth={isActive ? 3 : 1.5}
                strokeDasharray={isActive ? undefined : "5,5"}
                onPress={() => handleZonePress(zone)}
              />

              {/* Attached Tooltip for Active Zone */}
              {isActive && (
                <G>
                  <Rect
                    x={zone.cx - 40}
                    y={zone.cy - 14}
                    width="80"
                    height="28"
                    fill="#374151"
                    rx="6"
                  />
                  <SvgText
                    x={zone.cx}
                    y={zone.cy + 5}
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {zone.label}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}
      </Svg>

      {selectedBodyPart && (
        <View style={styles.selectionInfo}>
          <Text variant="bodyMedium" style={styles.selectionText}>
            Selected: {selectedBodyPart} ({selectedSide})
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  svg: {
    width: "100%",
    height: 400,
  },
  selectionInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#E9D5FF",
    borderRadius: 8,
  },
  selectionText: {
    color: "#6B21A8",
    fontWeight: "600",
  },
});
