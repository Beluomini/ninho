import { View, Text, Pressable, ScrollView, Alert, Switch, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Home,
  Bell,
  Moon,
  Sun,
  Globe,
  Info,
  ChevronRight,
  LogOut,
  Edit3,
} from "lucide-react-native";
import { useState } from "react";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { Avatar } from "../../src/components/ui/Avatar";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";
import type { Locale } from "../../src/i18n";

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
}

function SettingsRow({ icon, label, sublabel, onPress, right, theme }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center",
        paddingVertical: 14, borderBottomWidth: 1,
        borderBottomColor: theme.border + "30",
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.secondary, alignItems: "center", justifyContent: "center",
        marginRight: 12,
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>{label}</Text>
        {sublabel && (
          <Text style={{ fontSize: 12, color: theme.textLight, marginTop: 2 }}>{sublabel}</Text>
        )}
      </View>
      {right || <ChevronRight size={18} color={theme.inactive} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { house, currentUser } = useHouseData();
  const {
    t, i, locale, isDarkMode, userName, userPhoto,
    setLocale, setDarkMode, setUserName,
  } = useSettings();
  const theme = useTheme();

  const [showNameModal, setShowNameModal] = useState(false);
  const [editName, setEditName] = useState(userName);

  const handleSaveName = () => {
    if (editName.trim()) {
      setUserName(editName.trim());
    }
    setShowNameModal(false);
  };

  const handleLeaveHouse = () => {
    Alert.alert(
      t.settings.leaveConfirmTitle,
      t.settings.leaveConfirmMsg,
      [
        { text: t.settings.leaveCancel, style: "cancel" },
        { text: t.settings.leaveConfirm, style: "destructive" },
      ]
    );
  };

  const toggleLocale = () => {
    setLocale(locale === "pt" ? "en" : "pt");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>
            {t.settings.title}
          </Text>
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 16 }}>
          <Card theme={theme}>
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <Avatar uri={userPhoto} name={userName} size="lg" />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>
                  {userName}
                </Text>
                <Pressable onPress={() => { setEditName(userName); setShowNameModal(true); }}>
                  <Edit3 size={16} color={theme.primary} />
                </Pressable>
              </View>
              <Text style={{ fontSize: 14, color: theme.textLight }}>{currentUser.email}</Text>
              <View style={{
                backgroundColor: theme.secondary, borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
              }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>
                  {house.name}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Casa section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
            {t.settings.house}
          </Text>
          <Card theme={theme}>
            <SettingsRow
              icon={<Home size={16} color={theme.primary} />}
              label={t.settings.members}
              sublabel={i(t.settings.membersCount, { count: house.members.length })}
              theme={theme}
            />
            <SettingsRow
              icon={<User size={16} color={theme.primary} />}
              label={t.settings.invite}
              sublabel={t.settings.inviteDesc}
              theme={theme}
            />
          </Card>
        </View>

        {/* App section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
            {t.settings.app}
          </Text>
          <Card theme={theme}>
            <SettingsRow
              icon={<Bell size={16} color={theme.primary} />}
              label={t.settings.notifications}
              sublabel={t.settings.notificationsDesc}
              theme={theme}
            />
            <SettingsRow
              icon={isDarkMode ? <Moon size={16} color={theme.primary} /> : <Sun size={16} color={theme.primary} />}
              label={t.settings.theme}
              sublabel={isDarkMode ? t.settings.dark : t.settings.light}
              theme={theme}
              right={
                <Switch
                  value={isDarkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#fff"
                />
              }
            />
            <SettingsRow
              icon={<Globe size={16} color={theme.primary} />}
              label={t.settings.language}
              sublabel={locale === "pt" ? t.settings.portuguese : t.settings.english}
              onPress={toggleLocale}
              theme={theme}
              right={
                <View style={{
                  backgroundColor: theme.secondary, borderRadius: 12,
                  paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: theme.primary }}>
                    {locale.toUpperCase()}
                  </Text>
                </View>
              }
            />
            <SettingsRow
              icon={<Info size={16} color={theme.primary} />}
              label={t.settings.about}
              sublabel={t.settings.version}
              theme={theme}
            />
          </Card>
        </View>

        {/* Members preview */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
            {t.settings.residents}
          </Text>
          <Card theme={theme}>
            {house.members.map((member, idx) => {
              const displayName = member.id === "u1" ? userName : member.name;
              const displayPhoto = member.id === "u1" ? userPhoto : member.avatarUrl;
              return (
                <View
                  key={member.id}
                  style={{
                    flexDirection: "row", alignItems: "center", paddingVertical: 12,
                    borderBottomWidth: idx < house.members.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border + "30",
                  }}
                >
                  <Avatar uri={displayPhoto} name={displayName} size="md" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>
                      {displayName}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textLight }}>{member.email}</Text>
                  </View>
                  {member.id === currentUser.id && (
                    <View style={{ backgroundColor: theme.secondary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>
                        {t.settings.you}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        </View>

        {/* Leave house */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={handleLeaveHouse}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              paddingVertical: 16, backgroundColor: "rgba(239,68,68,0.1)",
              borderRadius: 16, gap: 8,
            }}
          >
            <LogOut size={18} color={theme.danger} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.danger }}>
              {t.settings.leaveHouse}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit name modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>
              {t.settings.editName}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                fontSize: 14, color: theme.text, marginBottom: 16,
              }}
              placeholder={t.settings.namePlaceholder}
              placeholderTextColor={theme.inactive}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowNameModal(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textLight }}>
                  {t.settings.leaveCancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveName}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.primary, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                  {t.settings.saveBtn}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
