import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, RotateCw, Plus, Trash2, CheckCircle } from "lucide-react-native";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { Avatar } from "../../src/components/ui/Avatar";
import { Badge } from "../../src/components/ui/Badge";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";
import type { Chore } from "../../src/types";

type ChoreRecurrence = Chore["recurrence"];

export default function ChoresScreen() {
  const {
    chores,
    house,
    getUserById,
    toggleChore,
    addChore,
    clearAllChores,
    clearCompletedChores,
  } = useHouseData();
  const { t, i, userName, userPhoto } = useSettings();
  const theme = useTheme();
  const [filterUser, setFilterUser] = useState<string | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState(house.members[0]?.id ?? "");
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [newRecurrence, setNewRecurrence] = useState<ChoreRecurrence>("once");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const filtered =
    filterUser === "all"
      ? chores
      : chores.filter((c) => c.assignedTo === filterUser);

  const recurrenceOptions: ChoreRecurrence[] = ["once", "daily", "weekly", "monthly"];
  const recurrenceLabels: Record<ChoreRecurrence, string> = {
    daily: t.chores.daily,
    weekly: t.chores.weekly,
    monthly: t.chores.monthly,
    once: t.chores.once,
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleAddChore = () => {
    if (!newTitle.trim()) return;
    addChore(newTitle.trim(), newAssignee, newDueDate, newRecurrence);
    setNewTitle("");
    setNewDueDate(() => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      return d;
    });
    setNewRecurrence("once");
    setShowAddForm(false);
  };

  const handleClearAll = () => {
    Alert.alert(
      t.chores.clearAllConfirmTitle,
      t.chores.clearAllConfirmMsg,
      [
        { text: t.chores.cancel, style: "cancel" },
        { text: t.chores.clearAll, style: "destructive", onPress: clearAllChores },
      ]
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      t.chores.clearCompletedConfirmTitle,
      t.chores.clearCompletedConfirmMsg,
      [
        { text: t.chores.cancel, style: "cancel" },
        { text: t.chores.clearCompleted, onPress: clearCompletedChores },
      ]
    );
  };

  const getMemberDisplay = (member: { id: string; name: string; avatarUrl: string }) => ({
    name: member.id === "u1" ? userName : member.name,
    photo: member.id === "u1" ? userPhoto : member.avatarUrl,
  });

  const chipMinWidth = 88;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>
          {t.chores.title}
        </Text>
        <Text style={{ fontSize: 14, color: theme.textLight, marginTop: 4 }}>
          {i(t.chores.pendingCount, { count: chores.filter((c) => !c.isCompleted).length })}
        </Text>
      </View>

      {/* Member filter - fixed height so it never grows when list is empty */}
      <View style={{ height: 44, marginBottom: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
          style={{ flexGrow: 0 }}
        >
        <Pressable
          onPress={() => setFilterUser("all")}
          style={{
            minWidth: chipMinWidth,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: filterUser === "all" ? theme.primary : theme.surface,
            borderWidth: filterUser === "all" ? 0 : 1,
            borderColor: theme.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: filterUser === "all" ? "#fff" : theme.textLight,
            }}
          >
            {t.chores.all}
          </Text>
        </Pressable>
        {house.members.map((member) => {
          const display = getMemberDisplay(member);
          const isSelected = filterUser === member.id;
          return (
            <Pressable
              key={member.id}
              onPress={() => setFilterUser(member.id)}
              style={{
                minWidth: chipMinWidth,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: isSelected ? theme.primary : theme.surface,
                borderWidth: isSelected ? 0 : 1,
                borderColor: theme.border,
              }}
            >
              <Avatar uri={display.photo} name={display.name} size="sm" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isSelected ? "#fff" : theme.textLight,
                }}
                numberOfLines={1}
              >
                {display.name.split(" ")[0]}
              </Text>
            </Pressable>
          );
        })}
        </ScrollView>
      </View>

      {/* Chores list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const assignee = getUserById(item.assignedTo);
          const display = assignee ? getMemberDisplay(assignee) : { name: "?", photo: undefined };
          return (
            <Pressable onPress={() => toggleChore(item.id)}>
              <Card theme={theme} style={item.isCompleted ? { opacity: 0.6 } : undefined}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: item.isCompleted ? theme.inactive : theme.text,
                        textDecorationLine: item.isCompleted ? "line-through" : "none",
                      }}
                    >
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <CalendarDays size={13} color={theme.textLight} />
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {formatDate(item.dueDate)} {formatTime(item.dueDate)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <RotateCw size={13} color={theme.textLight} />
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {recurrenceLabels[item.recurrence]}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Avatar uri={display.photo} name={display.name} size="sm" />
                    <Badge
                      label={item.isCompleted ? t.chores.done : t.chores.pending}
                      variant={item.isCompleted ? "success" : "outline"}
                      theme={theme}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />

      {/* Centered modal for new chore */}
      <Modal
        visible={showAddForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddForm(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
          onPress={() => setShowAddForm(false)}
        >
          <Pressable
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>
              {t.chores.newChore}
            </Text>

            <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>
              {t.chores.choreNameRequired}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: theme.text,
                marginBottom: 12,
              }}
              placeholder={t.chores.choreName}
              placeholderTextColor={theme.inactive}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>
              {t.chores.responsible}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {house.members.map((m) => {
                  const display = getMemberDisplay(m);
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setNewAssignee(m.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: newAssignee === m.id ? theme.primary : theme.inputBg,
                      }}
                    >
                      <Avatar uri={display.photo} name={display.name} size="sm" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: newAssignee === m.id ? "#fff" : theme.textLight,
                        }}
                      >
                        {display.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>
              {t.chores.recurrence}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {recurrenceOptions.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setNewRecurrence(r)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: newRecurrence === r ? theme.primary : theme.inputBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: newRecurrence === r ? "#fff" : theme.textLight,
                    }}
                  >
                    {recurrenceLabels[r]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: theme.inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <CalendarDays size={18} color={theme.primary} />
                <Text style={{ fontSize: 14, color: theme.text }}>{formatDate(newDueDate)}</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: theme.inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <RotateCw size={18} color={theme.primary} />
                <Text style={{ fontSize: 14, color: theme.text }}>{formatTime(newDueDate)}</Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newDueDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  if (Platform.OS === "android") setShowDatePicker(false);
                  if (date) setNewDueDate((prev) => new Date(prev.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())));
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={newDueDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  if (Platform.OS === "android") setShowTimePicker(false);
                  if (date) setNewDueDate((prev) => new Date(prev.setHours(date.getHours(), date.getMinutes(), 0, 0)));
                }}
              />
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              {showDatePicker || showTimePicker ? (
                <Pressable
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: theme.primary,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                    {t.chores.ok}
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowAddForm(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: theme.danger,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                      {t.chores.cancel}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddChore}
                    disabled={!newTitle.trim()}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: newTitle.trim() ? theme.primary : theme.inactive,
                      alignItems: "center",
                      opacity: newTitle.trim() ? 1 : 0.7,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                      {t.chores.create}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom bar: Limpar concluídas, Limpar todas, Criar tarefa */}
      {!showAddForm && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 12,
            paddingBottom: 24,
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            gap: 8,
          }}
        >
          <Pressable
            onPress={handleClearCompleted}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <CheckCircle size={18} color={theme.success} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textLight }}>
              {t.chores.clearCompleted}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleClearAll}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Trash2 size={18} color={theme.danger} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.danger }}>
              {t.chores.clearAll}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAddForm(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Plus size={24} color="#fff" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
