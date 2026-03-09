import { View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { Theme } from "../../constants/colors";

interface CardProps {
  children: ReactNode;
  className?: string;
  theme?: Theme;
  style?: ViewStyle;
}

export function Card({ children, theme, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: theme?.card ?? "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
