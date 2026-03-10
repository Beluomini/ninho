import "../global.css";
import { View, ActivityIndicator, LogBox } from "react-native";
import { Stack } from "expo-router";

// Suppress SafeAreaView deprecation warning from dependencies (e.g. react-native-screens).
// This app already uses SafeAreaView from "react-native-safe-area-context" everywhere.
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release",
]);
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SettingsProvider, useSettings } from "../src/contexts/SettingsContext";
import { getTheme } from "../src/constants/colors";

function AppContent() {
  const { isDarkMode, isLoaded } = useSettings();
  const theme = getTheme(isDarkMode);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
