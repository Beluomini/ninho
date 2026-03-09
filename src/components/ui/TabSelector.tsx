import { View, Text, Pressable } from "react-native";
import type { Theme } from "../../constants/colors";

interface TabSelectorProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
  theme?: Theme;
}

export function TabSelector({ tabs, activeTab, onTabChange, theme }: TabSelectorProps) {
  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: theme?.inputBg ?? "#F3F4F6",
      borderRadius: 12,
      padding: 4,
    }}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab}
          onPress={() => onTabChange(index)}
          style={{
            flex: 1, paddingVertical: 8, borderRadius: 8,
            alignItems: "center",
            backgroundColor: activeTab === index ? (theme?.surface ?? "#FFFFFF") : "transparent",
            shadowColor: activeTab === index ? "#000" : "transparent",
            shadowOpacity: activeTab === index ? 0.06 : 0,
            shadowRadius: 3,
            elevation: activeTab === index ? 1 : 0,
          }}
        >
          <Text style={{
            fontSize: 13, fontWeight: "600",
            color: activeTab === index ? (theme?.primary ?? "#4A7C59") : (theme?.inactive ?? "#9CA3AF"),
          }}>
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
