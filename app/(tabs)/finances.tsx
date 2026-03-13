import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
  Keyboard,
  Vibration,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  CalendarDays,
  Trash2,
  Pencil,
  RotateCw,
  PartyPopper,
} from "lucide-react-native";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { TabSelector } from "../../src/components/ui/TabSelector";
import { SwipeableRow } from "../../src/components/ui/SwipeableRow";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";
import type { RecurringFinanceRecurrence } from "../../src/types";

const FINANCE_CATEGORIES = ["Geral", "Moradia", "Utilidades", "Alimentação", "Renda", "Transporte", "Lazer", "Saúde"] as const;

export default function FinancesScreen() {
  const {
    transactions,
    balance,
    onboardingDone,
    recurringItems,
    investmentGoals,
    addTransaction,
    removeTransaction,
    setInitialBalance,
    setOnboardingDone,
    addRecurringItem,
    removeRecurringItem,
    addInvestmentGoal,
    addInvestmentContribution,
    removeInvestmentContribution,
    updateInvestmentGoal,
    removeInvestmentGoal,
    markGoalReachedShown,
  } = useHouseData();
  const { t, isDarkMode } = useSettings();
  const theme = useTheme();
  const pickerThemeVariant = isDarkMode ? "dark" : "light";

  const [activeTab, setActiveTab] = useState(0);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState<string | null>(null);
  const [showEditGoalModal, setShowEditGoalModal] = useState<string | null>(null);

  // Celebration
  const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null);
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Onboarding
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [pendingBalance, setPendingBalance] = useState("");

  // New transaction form
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newCategory, setNewCategory] = useState("Geral");
  const [newDate, setNewDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New recurring item form
  const [recurringDesc, setRecurringDesc] = useState("");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringType, setRecurringType] = useState<"income" | "expense">("income");
  const [recurringRecurrence, setRecurringRecurrence] = useState<RecurringFinanceRecurrence>("monthly");
  const [recurringCustomDays, setRecurringCustomDays] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState(() => new Date());
  const [showRecurringDatePicker, setShowRecurringDatePicker] = useState(false);

  // New goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");

  // Edit goal form
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");

  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value)
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const getRecurrenceLabel = (recurrence: RecurringFinanceRecurrence, customDays?: number) => {
    switch (recurrence) {
      case "daily": return t.finances.daily;
      case "weekly": return t.finances.weekly;
      case "monthly": return t.finances.monthly;
      case "custom": return customDays ? t.finances.everyXDays.replace("{{days}}", String(customDays)) : t.finances.custom;
    }
  };

  const incomeTotal = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const recurringIncome = recurringItems.filter((r) => r.type === "income");
  const recurringExpenses = recurringItems.filter((r) => r.type === "expense");

  const triggerCelebration = (goalId: string) => {
    setCelebratingGoalId(goalId);
    Vibration.vibrate(200);
    celebrationOpacity.setValue(0);
    celebrationScale.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(celebrationOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(celebrationOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(celebrationScale, { toValue: 1.3, duration: 300, useNativeDriver: true }),
        Animated.timing(celebrationScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1300),
        Animated.timing(celebrationScale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      markGoalReachedShown(goalId);
      setCelebratingGoalId(null);
    });
  };

  useEffect(() => {
    investmentGoals.forEach((goal) => {
      if (
        goal.targetAmount != null &&
        goal.currentAmount >= goal.targetAmount &&
        !goal.goalReachedShown &&
        celebratingGoalId !== goal.id
      ) {
        triggerCelebration(goal.id);
      }
    });
  }, [investmentGoals]);

  const handleFinishOnboarding = () => {
    const value = parseFloat(pendingBalance.replace(",", "."));
    if (!isNaN(value)) setInitialBalance(value);
    setOnboardingDone(true);
    setOnboardingStep(0);
    setPendingBalance("");
  };

  const handleAddTransaction = () => {
    const amount = parseFloat(newAmount.replace(",", "."));
    if (!newDesc.trim() || isNaN(amount)) return;
    addTransaction({
      description: newDesc.trim(),
      amount: newType === "expense" ? -Math.abs(amount) : Math.abs(amount),
      category: newCategory,
      date: new Date(newDate),
      type: newType,
    });
    setNewDesc("");
    setNewAmount("");
    setNewCategory("Geral");
    setNewDate(new Date());
    setShowTransactionModal(false);
  };

  const handleAddRecurring = () => {
    const amount = parseFloat(recurringAmount.replace(",", "."));
    if (!recurringDesc.trim() || isNaN(amount)) return;
    if (recurringRecurrence === "custom") {
      const days = parseInt(recurringCustomDays, 10);
      if (isNaN(days) || days <= 0) return;
    }
    addRecurringItem({
      description: recurringDesc.trim(),
      amount: recurringType === "expense" ? -Math.abs(amount) : Math.abs(amount),
      recurrence: recurringRecurrence,
      customDays: recurringRecurrence === "custom" ? parseInt(recurringCustomDays, 10) : undefined,
      startDate: new Date(recurringStartDate),
      type: recurringType,
    });
    setRecurringDesc("");
    setRecurringAmount("");
    setRecurringType("income");
    setRecurringRecurrence("monthly");
    setRecurringCustomDays("");
    setRecurringStartDate(new Date());
    setShowRecurringModal(false);
  };

  const handleAddGoal = () => {
    if (!goalName.trim()) return;
    const targetNum = goalTarget ? parseFloat(goalTarget.replace(",", ".")) : NaN;
    addInvestmentGoal(goalName.trim(), !isNaN(targetNum) ? targetNum : undefined);
    setGoalName("");
    setGoalTarget("");
    setShowGoalModal(false);
  };

  const handleAddContribution = () => {
    if (!showContributionModal) return;
    const amount = parseFloat(contributionAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;
    addInvestmentContribution(showContributionModal, amount);
    setContributionAmount("");
    setShowContributionModal(null);
  };

  const handleOpenEditGoal = (goalId: string) => {
    const goal = investmentGoals.find((g) => g.id === goalId);
    if (!goal) return;
    setEditGoalName(goal.name);
    setEditGoalTarget(goal.targetAmount != null ? String(goal.targetAmount).replace(".", ",") : "");
    setShowEditGoalModal(goalId);
  };

  const handleSaveEditGoal = () => {
    if (!showEditGoalModal || !editGoalName.trim()) return;
    const targetNum = editGoalTarget ? parseFloat(editGoalTarget.replace(",", ".")) : NaN;
    updateInvestmentGoal(showEditGoalModal, {
      name: editGoalName.trim(),
      targetAmount: !isNaN(targetNum) ? targetNum : undefined,
    });
    setShowEditGoalModal(null);
  };

  const confirmDeleteItem = (onDelete: () => void) => {
    Alert.alert(t.finances.deleteConfirmTitle, t.finances.deleteConfirmMsg, [
      { text: t.finances.cancel, style: "cancel" },
      { text: t.finances.delete, style: "destructive", onPress: onDelete },
    ]);
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const swipeProps = {
    confirmTitle: t.finances.deleteConfirmTitle,
    confirmMsg: t.finances.deleteConfirmMsg,
    cancelLabel: t.finances.cancel,
    deleteLabel: t.finances.delete,
  };

  // --- Recurring modal content (shared between onboarding and main) ---
  const renderRecurringModalContent = () => (
    <Pressable
      style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
      onPress={() => { Keyboard.dismiss(); setShowRecurringModal(false); }}
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
          maxHeight: "90%",
        }}
        onPress={() => Keyboard.dismiss()}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>
            {recurringType === "income" ? t.finances.recurringIncome : t.finances.recurringExpenses}
          </Text>

          {onboardingDone && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <Pressable
                onPress={() => setRecurringType("income")}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: recurringType === "income" ? "rgba(34,197,94,0.15)" : theme.inputBg,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: recurringType === "income" ? theme.success : theme.textLight }}>
                  {t.finances.incomeType}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRecurringType("expense")}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: recurringType === "expense" ? "rgba(239,68,68,0.15)" : theme.inputBg,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: recurringType === "expense" ? theme.danger : theme.textLight }}>
                  {t.finances.expense}
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.description}</Text>
          <TextInput
            style={{
              backgroundColor: theme.inputBg, borderRadius: 12,
              paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
              color: theme.text, marginBottom: 12,
            }}
            placeholder={t.finances.description}
            placeholderTextColor={theme.inactive}
            value={recurringDesc}
            onChangeText={setRecurringDesc}
          />

          <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.amount}</Text>
          <TextInput
            style={{
              backgroundColor: theme.inputBg, borderRadius: 12,
              paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
              color: theme.text, marginBottom: 12,
            }}
            placeholder={t.finances.amount}
            placeholderTextColor={theme.inactive}
            keyboardType="numeric"
            value={recurringAmount}
            onChangeText={setRecurringAmount}
          />

          <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>{t.finances.recurrence}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {(["daily", "weekly", "monthly", "custom"] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRecurringRecurrence(r)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: recurringRecurrence === r ? theme.primary : theme.inputBg,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: recurringRecurrence === r ? "#fff" : theme.textLight }}>
                  {r === "daily" ? t.finances.daily : r === "weekly" ? t.finances.weekly : r === "monthly" ? t.finances.monthly : t.finances.custom}
                </Text>
              </Pressable>
            ))}
          </View>

          {recurringRecurrence === "custom" && (
            <>
              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.customDays}</Text>
              <TextInput
                style={{
                  backgroundColor: theme.inputBg, borderRadius: 12,
                  paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
                  color: theme.text, marginBottom: 12,
                }}
                placeholder={t.finances.customDaysPlaceholder}
                placeholderTextColor={theme.inactive}
                keyboardType="numeric"
                value={recurringCustomDays}
                onChangeText={setRecurringCustomDays}
              />
            </>
          )}

          <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>{t.finances.startDate}</Text>
          <Pressable
            onPress={() => setShowRecurringDatePicker(true)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              backgroundColor: theme.inputBg, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
            }}
          >
            <CalendarDays size={18} color={theme.primary} />
            <Text style={{ fontSize: 14, color: theme.text }}>{formatDate(recurringStartDate)}</Text>
          </Pressable>
          {showRecurringDatePicker && (
            <DateTimePicker
              value={recurringStartDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant={pickerThemeVariant}
              onChange={(_, date) => {
                if (Platform.OS === "android") setShowRecurringDatePicker(false);
                if (date) setRecurringStartDate(date);
              }}
            />
          )}

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setShowRecurringModal(false)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{t.finances.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleAddRecurring}
              disabled={!recurringDesc.trim() || !recurringAmount || (recurringRecurrence === "custom" && !recurringCustomDays)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                backgroundColor:
                  recurringDesc.trim() && recurringAmount && (recurringRecurrence !== "custom" || recurringCustomDays)
                    ? theme.primary
                    : theme.inactive,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{t.finances.save}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  );

  // --- Onboarding ---
  if (!onboardingDone) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text, marginBottom: 8 }}>
            {t.finances.onboardingTitle}
          </Text>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {onboardingStep === 0 && (
            <>
              <Text style={{ fontSize: 16, color: theme.textLight, marginBottom: 12 }}>
                {t.finances.onboardingBalanceHint}
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.inputBg, borderRadius: 12,
                  paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
                  color: theme.text, marginBottom: 24,
                }}
                placeholder={t.finances.amount}
                placeholderTextColor={theme.inactive}
                keyboardType="numeric"
                value={pendingBalance}
                onChangeText={setPendingBalance}
              />
              <Pressable
                onPress={() => setOnboardingStep(1)}
                style={{ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{t.finances.continue}</Text>
              </Pressable>
            </>
          )}

          {onboardingStep === 1 && (
            <>
              <Text style={{ fontSize: 16, color: theme.textLight, marginBottom: 8 }}>
                {t.finances.onboardingRecurringIncomeHint}
              </Text>
              {recurringIncome.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  {recurringIncome.map((r) => (
                    <View key={r.id} style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, marginBottom: 8,
                    }}>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{r.description}</Text>
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {formatCurrency(r.amount)} · {getRecurrenceLabel(r.recurrence, r.customDays)}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeRecurringItem(r.id)} hitSlop={8}>
                        <Trash2 size={18} color={theme.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                onPress={() => { setRecurringType("income"); setShowRecurringModal(true); }}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 12, borderRadius: 12, borderWidth: 1,
                  borderColor: theme.border, borderStyle: "dashed", marginBottom: 24,
                }}
              >
                <Plus size={18} color={theme.primary} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>
                  {t.finances.addRecurring} {t.finances.recurringIncome.toLowerCase()}
                </Text>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setOnboardingStep(0)}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text }}>{t.finances.skip}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setOnboardingStep(2)}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: theme.primary, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>{t.finances.continue}</Text>
                </Pressable>
              </View>
            </>
          )}

          {onboardingStep === 2 && (
            <>
              <Text style={{ fontSize: 16, color: theme.textLight, marginBottom: 8 }}>
                {t.finances.onboardingRecurringExpensesHint}
              </Text>
              {recurringExpenses.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  {recurringExpenses.map((r) => (
                    <View key={r.id} style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, marginBottom: 8,
                    }}>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{r.description}</Text>
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {formatCurrency(Math.abs(r.amount))} · {getRecurrenceLabel(r.recurrence, r.customDays)}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeRecurringItem(r.id)} hitSlop={8}>
                        <Trash2 size={18} color={theme.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                onPress={() => { setRecurringType("expense"); setShowRecurringModal(true); }}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 12, borderRadius: 12, borderWidth: 1,
                  borderColor: theme.border, borderStyle: "dashed", marginBottom: 24,
                }}
              >
                <Plus size={18} color={theme.primary} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>
                  {t.finances.addRecurring} {t.finances.recurringExpenses.toLowerCase()}
                </Text>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setOnboardingStep(1)}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text }}>{t.finances.skip}</Text>
                </Pressable>
                <Pressable
                  onPress={handleFinishOnboarding}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: theme.primary, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>{t.finances.finish}</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        <Modal visible={showRecurringModal} transparent animationType="fade">
          {renderRecurringModalContent()}
        </Modal>
      </SafeAreaView>
    );
  }

  // --- Main screen (after onboarding) ---
  const tabs = [t.finances.overview, t.finances.recurring, t.finances.statistics, t.finances.investments];
  const goalBeingEdited = showEditGoalModal ? investmentGoals.find((g) => g.id === showEditGoalModal) : null;
  const isGoalReached = (goal: typeof investmentGoals[0]) =>
    goal.targetAmount != null && goal.currentAmount >= goal.targetAmount;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>{t.finances.title}</Text>
      </View>

      {/* Balance card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ backgroundColor: theme.primary, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{t.finances.currentBalance}</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>{formatCurrency(balance)}</Text>
          <View style={{ flexDirection: "row", marginTop: 16, gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ArrowUpCircle size={18} color="#22C55E" />
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.finances.income}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{formatCurrency(incomeTotal)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ArrowDownCircle size={18} color="#EF4444" />
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.finances.expenses}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{formatCurrency(expenseTotal)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} theme={theme} />
      </View>

      {/* ============ OVERVIEW TAB ============ */}
      {activeTab === 0 && (
        <FlatList
          data={sortedTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListHeaderComponent={
            recurringItems.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textLight, marginBottom: 8 }}>
                  {t.finances.recurringValues}
                </Text>
                {recurringItems.map((r) => {
                  const isInc = r.type === "income";
                  return (
                    <View key={r.id} style={{ marginBottom: 6 }}>
                      <Card theme={theme}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: isInc ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            alignItems: "center", justifyContent: "center",
                          }}>
                            <RotateCw size={16} color={isInc ? theme.success : theme.danger} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>{r.description}</Text>
                            <Text style={{ fontSize: 11, color: theme.textLight }}>
                              {getRecurrenceLabel(r.recurrence, r.customDays)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: isInc ? theme.success : theme.danger }}>
                            {isInc ? "+" : "-"} {formatCurrency(r.amount)}
                          </Text>
                        </View>
                      </Card>
                    </View>
                  );
                })}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <Text style={{ color: theme.textLight, fontSize: 14, textAlign: "center" }}>
                {t.finances.noTransactions}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isIncome = item.type === "income";
            return (
              <SwipeableRow {...swipeProps} onDelete={() => removeTransaction(item.id)}>
                <Card theme={theme}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: isIncome ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {isIncome ? <TrendingUp size={18} color={theme.success} /> : <TrendingDown size={18} color={theme.danger} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{item.description}</Text>
                      <Text style={{ fontSize: 12, color: theme.textLight }}>{item.category} · {formatDate(item.date)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: isIncome ? theme.success : theme.danger }}>
                      {isIncome ? "+" : "-"} {formatCurrency(item.amount)}
                    </Text>
                  </View>
                </Card>
              </SwipeableRow>
            );
          }}
        />
      )}

      {/* ============ RECURRING TAB ============ */}
      {activeTab === 1 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textLight, marginBottom: 8 }}>{t.finances.recurringIncome}</Text>
          {recurringIncome.length === 0 ? (
            <View style={{ paddingVertical: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: theme.textLight }}>{t.finances.noRecurring}</Text>
            </View>
          ) : (
            recurringIncome.map((r) => (
              <View key={r.id} style={{ marginBottom: 8 }}>
                <SwipeableRow {...swipeProps} onDelete={() => removeRecurringItem(r.id)}>
                  <Card theme={theme}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: "rgba(34,197,94,0.15)", alignItems: "center", justifyContent: "center",
                      }}>
                        <TrendingUp size={18} color={theme.success} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{r.description}</Text>
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {formatCurrency(r.amount)} · {getRecurrenceLabel(r.recurrence, r.customDays)} · {formatDate(r.startDate)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </SwipeableRow>
              </View>
            ))
          )}

          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textLight, marginBottom: 8, marginTop: 8 }}>{t.finances.recurringExpenses}</Text>
          {recurringExpenses.length === 0 ? (
            <View style={{ paddingVertical: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: theme.textLight }}>{t.finances.noRecurring}</Text>
            </View>
          ) : (
            recurringExpenses.map((r) => (
              <View key={r.id} style={{ marginBottom: 8 }}>
                <SwipeableRow {...swipeProps} onDelete={() => removeRecurringItem(r.id)}>
                  <Card theme={theme}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center",
                      }}>
                        <TrendingDown size={18} color={theme.danger} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{r.description}</Text>
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {formatCurrency(Math.abs(r.amount))} · {getRecurrenceLabel(r.recurrence, r.customDays)} · {formatDate(r.startDate)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </SwipeableRow>
              </View>
            ))
          )}

          <Pressable
            onPress={() => {
              setRecurringType("income");
              setRecurringDesc("");
              setRecurringAmount("");
              setRecurringCustomDays("");
              setRecurringStartDate(new Date());
              setRecurringRecurrence("monthly");
              setShowRecurringModal(true);
            }}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              paddingVertical: 14, borderRadius: 12, backgroundColor: theme.surface,
              borderWidth: 1, borderColor: theme.border, marginTop: 8,
            }}
          >
            <Plus size={18} color={theme.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>{t.finances.addRecurring}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ============ STATISTICS TAB ============ */}
      {activeTab === 2 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <Text style={{ color: theme.textLight, fontSize: 14, textAlign: "center" }}>{t.finances.statsPlaceholder}</Text>
        </View>
      )}

      {/* ============ INVESTMENTS TAB ============ */}
      {activeTab === 3 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {investmentGoals.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: "center" }}>
              <Target size={48} color={theme.inactive} style={{ marginBottom: 16 }} />
              <Text style={{ color: theme.textLight, fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                {t.finances.noInvestments}
              </Text>
              <Pressable
                onPress={() => setShowGoalModal(true)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 8,
                  paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: theme.primary,
                }}
              >
                <Plus size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{t.finances.addGoal}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {investmentGoals.map((goal) => {
                const reached = isGoalReached(goal);
                const progress = goal.targetAmount ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
                return (
                  <View key={goal.id} style={{ marginBottom: 12 }}>
                    <SwipeableRow {...swipeProps} onDelete={() => removeInvestmentGoal(goal.id)}>
                      <Card theme={theme}>
                        {celebratingGoalId === goal.id && (
                          <Animated.View style={{
                            position: "absolute", top: -20, right: -10, zIndex: 10,
                            transform: [{ scale: celebrationScale }],
                            opacity: celebrationOpacity,
                          }}>
                            <PartyPopper size={40} color="#F59E0B" />
                          </Animated.View>
                        )}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View style={{
                            width: 44, height: 44, borderRadius: 22,
                            backgroundColor: reached ? "rgba(34,197,94,0.15)" : "rgba(74, 124, 89, 0.15)",
                            alignItems: "center", justifyContent: "center",
                          }}>
                            {reached ? <PartyPopper size={22} color={theme.success} /> : <Target size={22} color={theme.primary} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text }}>{goal.name}</Text>
                            <Text style={{ fontSize: 13, color: theme.textLight }}>
                              {formatCurrency(goal.currentAmount)}
                              {goal.targetAmount != null && ` / ${formatCurrency(goal.targetAmount)}`}
                            </Text>
                            {reached && (
                              <Text style={{ fontSize: 12, fontWeight: "700", color: theme.success, marginTop: 2 }}>
                                {t.finances.goalReached}
                              </Text>
                            )}
                          </View>
                          {reached ? (
                            <Pressable
                              onPress={() => handleOpenEditGoal(goal.id)}
                              style={{
                                flexDirection: "row", alignItems: "center", gap: 6,
                                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
                                backgroundColor: theme.inputBg,
                              }}
                            >
                              <Pencil size={16} color={theme.primary} />
                              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>{t.finances.editGoal}</Text>
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() => { setContributionAmount(""); setShowContributionModal(goal.id); }}
                              style={{
                                flexDirection: "row", alignItems: "center", gap: 6,
                                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
                                backgroundColor: theme.primary,
                              }}
                            >
                              <Plus size={16} color="#fff" />
                              <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{t.finances.addContribution}</Text>
                            </Pressable>
                          )}
                        </View>
                        {goal.targetAmount != null && (
                          <View style={{
                            marginTop: 12, height: 6, borderRadius: 3,
                            backgroundColor: theme.inputBg, overflow: "hidden",
                          }}>
                            <View style={{
                              height: 6, borderRadius: 3, width: `${progress * 100}%`,
                              backgroundColor: reached ? theme.success : theme.primary,
                            }} />
                          </View>
                        )}
                      </Card>
                    </SwipeableRow>
                  </View>
                );
              })}
              <Pressable
                onPress={() => setShowGoalModal(true)}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 14, borderRadius: 12, borderWidth: 1,
                  borderColor: theme.border, borderStyle: "dashed", marginTop: 8,
                }}
              >
                <Plus size={18} color={theme.primary} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>{t.finances.addGoal}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      {/* FAB - Overview only */}
      {activeTab === 0 && (
        <View style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}>
          <Pressable
            onPress={() => setShowTransactionModal(true)}
            style={{
              backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 16,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Plus size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{t.finances.newExpense}</Text>
          </Pressable>
        </View>
      )}

      {/* ============ TRANSACTION MODAL (no recurrence) ============ */}
      <Modal visible={showTransactionModal} transparent animationType="fade" onRequestClose={() => setShowTransactionModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => { Keyboard.dismiss(); setShowTransactionModal(false); }}
        >
          <Pressable
            style={{
              width: "100%", maxWidth: 360, backgroundColor: theme.surface,
              borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, maxHeight: "90%",
            }}
            onPress={() => Keyboard.dismiss()}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>
                {t.finances.newTransaction}
              </Text>

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>{t.finances.type}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setNewType("expense")}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                    backgroundColor: newType === "expense" ? "rgba(239,68,68,0.15)" : theme.inputBg,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: newType === "expense" ? theme.danger : theme.textLight }}>
                    {t.finances.expense}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setNewType("income")}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                    backgroundColor: newType === "income" ? "rgba(34,197,94,0.15)" : theme.inputBg,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: newType === "income" ? theme.success : theme.textLight }}>
                    {t.finances.incomeType}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.description}</Text>
              <TextInput
                style={{
                  backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                  paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 12,
                }}
                placeholder={t.finances.description}
                placeholderTextColor={theme.inactive}
                value={newDesc}
                onChangeText={setNewDesc}
              />

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.amount}</Text>
              <TextInput
                style={{
                  backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                  paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 12,
                }}
                placeholder={t.finances.amount}
                placeholderTextColor={theme.inactive}
                keyboardType="numeric"
                value={newAmount}
                onChangeText={setNewAmount}
              />

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>{t.finances.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {FINANCE_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setNewCategory(cat)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                        backgroundColor: newCategory === cat ? theme.primary : theme.inputBg,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: newCategory === cat ? "#fff" : theme.textLight }}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 8 }}>{t.finances.date}</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 8,
                  backgroundColor: theme.inputBg, borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
                }}
              >
                <CalendarDays size={18} color={theme.primary} />
                <Text style={{ fontSize: 14, color: theme.text }}>{formatDate(newDate)}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={newDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  themeVariant={pickerThemeVariant}
                  onChange={(_, date) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (date) setNewDate(date);
                  }}
                />
              )}

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setShowTransactionModal(false)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{t.finances.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddTransaction}
                  disabled={!newDesc.trim() || !newAmount}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                    backgroundColor: newDesc.trim() && newAmount ? theme.primary : theme.inactive,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{t.finances.save}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ============ RECURRING MODAL ============ */}
      <Modal visible={showRecurringModal} transparent animationType="fade">
        {renderRecurringModalContent()}
      </Modal>

      {/* ============ NEW GOAL MODAL ============ */}
      <Modal visible={showGoalModal} transparent animationType="fade" onRequestClose={() => setShowGoalModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => { Keyboard.dismiss(); setShowGoalModal(false); }}
        >
          <Pressable
            style={{
              width: "100%", maxWidth: 360, backgroundColor: theme.surface,
              borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border,
            }}
            onPress={() => Keyboard.dismiss()}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>{t.finances.addGoal}</Text>
            <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.goalName}</Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 12,
              }}
              placeholder="Ex: Reserva de emergência, Carro novo"
              placeholderTextColor={theme.inactive}
              value={goalName}
              onChangeText={setGoalName}
            />
            <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.targetAmount} (opcional)</Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 20,
              }}
              placeholder={t.finances.amount}
              placeholderTextColor={theme.inactive}
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowGoalModal(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{t.finances.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleAddGoal}
                disabled={!goalName.trim()}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                  backgroundColor: goalName.trim() ? theme.primary : theme.inactive,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{t.finances.create}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ============ CONTRIBUTION MODAL ============ */}
      <Modal visible={showContributionModal !== null} transparent animationType="fade" onRequestClose={() => setShowContributionModal(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => { Keyboard.dismiss(); setShowContributionModal(null); }}
        >
          <Pressable
            style={{
              width: "100%", maxWidth: 360, backgroundColor: theme.surface,
              borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border,
            }}
            onPress={() => Keyboard.dismiss()}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>{t.finances.addContribution}</Text>
            <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.contributionAmount}</Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 20,
              }}
              placeholder={t.finances.amount}
              placeholderTextColor={theme.inactive}
              keyboardType="numeric"
              value={contributionAmount}
              onChangeText={setContributionAmount}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowContributionModal(null)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{t.finances.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleAddContribution}
                disabled={!contributionAmount || parseFloat(contributionAmount.replace(",", ".")) <= 0}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                  backgroundColor: contributionAmount && parseFloat(contributionAmount.replace(",", ".")) > 0 ? theme.primary : theme.inactive,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{t.finances.save}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ============ EDIT GOAL MODAL ============ */}
      <Modal visible={showEditGoalModal !== null} transparent animationType="fade" onRequestClose={() => setShowEditGoalModal(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => { Keyboard.dismiss(); setShowEditGoalModal(null); }}
        >
          <Pressable
            style={{
              width: "100%", maxWidth: 360, backgroundColor: theme.surface,
              borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, maxHeight: "85%",
            }}
            onPress={() => Keyboard.dismiss()}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 }}>{t.finances.editGoal}</Text>

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.goalName}</Text>
              <TextInput
                style={{
                  backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                  paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 12,
                }}
                value={editGoalName}
                onChangeText={setEditGoalName}
              />

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.targetAmount}</Text>
              <TextInput
                style={{
                  backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                  paddingVertical: 12, fontSize: 14, color: theme.text, marginBottom: 16,
                }}
                placeholder={t.finances.amount}
                placeholderTextColor={theme.inactive}
                keyboardType="numeric"
                value={editGoalTarget}
                onChangeText={setEditGoalTarget}
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textLight, marginBottom: 8 }}>{t.finances.contributions}</Text>
              {goalBeingEdited && goalBeingEdited.contributions.length === 0 && (
                <Text style={{ fontSize: 13, color: theme.textLight, marginBottom: 16 }}>{t.finances.noContributions}</Text>
              )}
              {goalBeingEdited?.contributions.map((c) => (
                <View key={c.id} style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, marginBottom: 8,
                }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{formatCurrency(c.amount)}</Text>
                    <Text style={{ fontSize: 12, color: theme.textLight }}>{formatDate(c.date)}</Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDeleteItem(() => removeInvestmentContribution(showEditGoalModal!, c.id))}
                    hitSlop={8}
                  >
                    <Trash2 size={18} color={theme.danger} />
                  </Pressable>
                </View>
              ))}

              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={() => setShowEditGoalModal(null)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{t.finances.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEditGoal}
                  disabled={!editGoalName.trim()}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                    backgroundColor: editGoalName.trim() ? theme.primary : theme.inactive,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{t.finances.save}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
