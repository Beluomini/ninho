import { Tabs } from "expo-router";
import {
  MessageSquare,
  ShoppingCart,
  CheckSquare,
  Wallet,
  Settings,
} from "lucide-react-native";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";

export default function TabLayout() {
  const { t } = useSettings();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.inactive,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 64,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.bulletin,
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: t.tabs.shopping,
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          title: t.tabs.chores,
          tabBarIcon: ({ color, size }) => (
            <CheckSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: t.tabs.finances,
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
