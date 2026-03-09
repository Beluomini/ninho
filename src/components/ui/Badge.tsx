import { View, Text } from "react-native";
import type { Theme } from "../../constants/colors";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "danger" | "outline";
  theme?: Theme;
}

export function Badge({ label, variant = "default", theme }: BadgeProps) {
  const bgColors = {
    default: theme?.secondary ?? "#A8D5BA",
    success: "rgba(34,197,94,0.15)",
    danger: "rgba(239,68,68,0.15)",
    outline: "transparent",
  };

  const textColors = {
    default: theme?.primary ?? "#4A7C59",
    success: theme?.success ?? "#22C55E",
    danger: theme?.danger ?? "#EF4444",
    outline: theme?.textLight ?? "#6B7280",
  };

  return (
    <View
      style={{
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: bgColors[variant],
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: theme?.border ?? "#E0E0E0",
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "600", color: textColors[variant] }}>
        {label}
      </Text>
    </View>
  );
}
