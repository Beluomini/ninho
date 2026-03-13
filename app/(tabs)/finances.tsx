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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useKeyboardVisible } from "../../src/hooks/useKeyboardVisible";
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

type StatsRange = "daily" | "weekly" | "monthly";

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
    tags,
    addTag,
    addSubtag,
  } = useHouseData();
  const { t, isDarkMode } = useSettings();
  const theme = useTheme();
  const { dismissIfVisible } = useKeyboardVisible();
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

  // Statistics
  const [statsRange, setStatsRange] = useState<StatsRange>("monthly");
  const chartAnim = useRef(new Animated.Value(0)).current;

  // Summary card range (day / week / month)
  type SummaryRange = "day" | "week" | "month";
  const [summaryRange, setSummaryRange] = useState<SummaryRange>("month");

  // Onboarding
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [pendingBalance, setPendingBalance] = useState("");

  // New transaction form
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newTag, setNewTag] = useState("Geral");
  const [newSubtag, setNewSubtag] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [subtagSearch, setSubtagSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSubtagDropdown, setShowSubtagDropdown] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Stats filters
  const [statsFilterTags, setStatsFilterTags] = useState<string[]>([]);
  const [statsFilterSubtags, setStatsFilterSubtags] = useState<string[]>([]);
  const [statsTagSearch, setStatsTagSearch] = useState("");
  const [statsSubtagSearch, setStatsSubtagSearch] = useState("");
  const [selectedBucketIndex, setSelectedBucketIndex] = useState<number | null>(null);

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

  const financeTransactions = transactions.filter(
    (tx) => tx.type === "income" || tx.type === "expense"
  );

  const incomeTotal = financeTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = financeTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const recurringIncome = recurringItems.filter((r) => r.type === "income");
  const recurringExpenses = recurringItems.filter((r) => r.type === "expense");

  type StatsBucket = {
    label: string;
    income: number;
    expense: number;
    transactions: typeof transactions;
  };

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay() || 7; // Sunday -> 7
    if (day !== 1) {
      d.setDate(d.getDate() - (day - 1));
    }
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const startOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const filteredFinanceTransactions = financeTransactions.filter((tx) => {
    if (statsFilterTags.length > 0 && !statsFilterTags.includes(tx.tag)) return false;
    if (statsFilterSubtags.length > 0 && (!tx.subtag || !statsFilterSubtags.includes(tx.subtag))) return false;
    return true;
  });

  const generateRecurringVirtualTxs = (rangeStart: Date, rangeEnd: Date): typeof financeTransactions => {
    const result: typeof financeTransactions = [];
    let vIdx = 0;
    for (const item of recurringItems) {
      const start = new Date(item.startDate);
      start.setHours(0, 0, 0, 0);
      let current = new Date(start);
      let safety = 10000;
      while (current <= rangeEnd && safety-- > 0) {
        if (current >= rangeStart) {
          result.push({
            id: `rv_${item.id}_${vIdx++}`,
            description: item.description,
            amount: item.amount,
            tag: item.category ?? "Recorrente",
            date: new Date(current),
            paidBy: "",
            type: item.type,
          });
        }
        const next = new Date(current);
        switch (item.recurrence) {
          case "daily": next.setDate(next.getDate() + 1); break;
          case "weekly": next.setDate(next.getDate() + 7); break;
          case "monthly": next.setMonth(next.getMonth() + 1); break;
          case "custom": next.setDate(next.getDate() + (item.customDays || 1)); break;
        }
        current = next;
      }
    }
    return result;
  };

  const getStatsBuckets = (range: StatsRange): StatsBucket[] => {
    const now = new Date();
    const buckets: StatsBucket[] = [];

    let rangeStart: Date;
    if (range === "daily") {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    } else if (range === "weekly") {
      const ws = startOfWeek(now);
      rangeStart = new Date(ws);
      rangeStart.setDate(ws.getDate() - 7 * 7);
    } else {
      const ms = startOfMonth(now);
      rangeStart = new Date(ms);
      rangeStart.setMonth(ms.getMonth() - 5);
    }
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);

    const virtualTxs = generateRecurringVirtualTxs(rangeStart, rangeEnd);
    const txs = [...filteredFinanceTransactions, ...virtualTxs];

    if (txs.length === 0) return buckets;

    const makeBucket = (label: string, matchedTxs: typeof txs): StatsBucket => ({
      label,
      income: matchedTxs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0),
      expense: matchedTxs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + Math.abs(tx.amount), 0),
      transactions: matchedTxs,
    });

    if (range === "daily") {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const bucketDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const label = `${bucketDate.getDate().toString().padStart(2, "0")}/${(bucketDate.getMonth() + 1).toString().padStart(2, "0")}`;
        const matched = txs.filter((tx) => isSameDay(new Date(tx.date), bucketDate));
        buckets.push(makeBucket(label, matched));
      }
      return buckets;
    }

    if (range === "weekly") {
      const currentWeekStart = startOfWeek(now);
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(currentWeekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const label = `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`;
        const matched = txs.filter((tx) => { const d = new Date(tx.date); return d >= weekStart && d <= weekEnd; });
        buckets.push(makeBucket(label, matched));
      }
      return buckets;
    }

    // monthly
    const currentMonthStart = startOfMonth(now);
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentMonthStart);
      monthStart.setMonth(currentMonthStart.getMonth() - i);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = `${(monthStart.getMonth() + 1).toString().padStart(2, "0")}/${String(monthStart.getFullYear()).slice(-2)}`;
      const matched = txs.filter((tx) => { const d = new Date(tx.date); return d >= monthStart && d <= monthEnd; });
      buckets.push(makeBucket(label, matched));
    }
    return buckets;
  };

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

  useEffect(() => {
    setSelectedBucketIndex(null);
    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [statsRange, financeTransactions.length, statsFilterTags, statsFilterSubtags, recurringItems]);

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
      tag: newTag,
      subtag: newSubtag || undefined,
      date: new Date(newDate),
      type: newType,
    });
    setNewDesc("");
    setNewAmount("");
    setNewTag("Geral");
    setNewSubtag("");
    setTagSearch("");
    setSubtagSearch("");
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
        onPress={() => { if (!dismissIfVisible()) setShowRecurringModal(false); }}
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
          onPress={() => dismissIfVisible()}
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
    </KeyboardAvoidingView>
  );

  // --- Onboarding ---
  if (!onboardingDone) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
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

  // Summary (card) helpers
  const getSummaryRangeBounds = (range: SummaryRange) => {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (range === "day") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      start = startOfWeek(now);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start = startOfMonth(now);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
  };

  const { start: summaryStart, end: summaryEnd } = getSummaryRangeBounds(summaryRange);
  const summaryFinanceTxs = financeTransactions.filter((tx) => {
    const d = new Date(tx.date);
    return d >= summaryStart && d <= summaryEnd;
  });
  const summaryRecurringTxs = generateRecurringVirtualTxs(summaryStart, summaryEnd);
  const summaryAllTxs = [...summaryFinanceTxs, ...summaryRecurringTxs];

  const summaryIncome = summaryAllTxs
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const summaryExpense = summaryAllTxs
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>{t.finances.title}</Text>
      </View>

      {/* Balance card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ backgroundColor: theme.primary, borderRadius: 16, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{t.finances.currentBalance}</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>{formatCurrency(balance)}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {([
                ["day", t.finances.daily],
                ["week", t.finances.weekly],
                ["month", t.finances.monthly],
              ] as const).map(([value, label]) => {
                const selected = summaryRange === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSummaryRange(value)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: selected ? "#fff" : "rgba(255,255,255,0.15)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: selected ? theme.primary : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ flexDirection: "row", marginTop: 8, gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ArrowUpCircle size={18} color="#22C55E" />
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.finances.income}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{formatCurrency(summaryIncome)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ArrowDownCircle size={18} color="#EF4444" />
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.finances.expenses}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{formatCurrency(summaryExpense)}</Text>
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
                      <Text style={{ fontSize: 12, color: theme.textLight }}>{item.tag}{item.subtag ? ` · ${item.subtag}` : ""} · {formatDate(item.date)}</Text>
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 8 }}>
              {t.finances.statsIncomeVsExpense}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {([
                ["daily", t.finances.daily],
                ["weekly", t.finances.weekly],
                ["monthly", t.finances.monthly],
              ] as const).map(([value, label]) => {
                const selected = statsRange === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setStatsRange(value)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: selected ? theme.primary : theme.inputBg,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: selected ? "#fff" : theme.textLight }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textLight, marginBottom: 6 }}>
              {t.finances.filterByTag}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 10, paddingHorizontal: 12,
                paddingVertical: 8, fontSize: 13, color: theme.text, marginBottom: 6,
              }}
              placeholder={t.finances.filterSearch}
              placeholderTextColor={theme.inactive}
              value={statsTagSearch}
              onChangeText={setStatsTagSearch}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {Object.keys(tags)
                  .filter((tg) => !statsTagSearch || tg.toLowerCase().includes(statsTagSearch.toLowerCase()))
                  .map((tg) => {
                    const sel = statsFilterTags.includes(tg);
                    return (
                      <Pressable
                        key={tg}
                        onPress={() => setStatsFilterTags((prev) => sel ? prev.filter((x) => x !== tg) : [...prev, tg])}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                          backgroundColor: sel ? theme.primary : theme.inputBg,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: sel ? "#fff" : theme.textLight }}>{tg}</Text>
                      </Pressable>
                    );
                  })}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textLight, marginBottom: 6 }}>
              {t.finances.filterBySubtag}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 10, paddingHorizontal: 12,
                paddingVertical: 8, fontSize: 13, color: theme.text, marginBottom: 6,
              }}
              placeholder={t.finances.filterSearch}
              placeholderTextColor={theme.inactive}
              value={statsSubtagSearch}
              onChangeText={setStatsSubtagSearch}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {(() => {
                  const relevantTags = statsFilterTags.length > 0 ? statsFilterTags : Object.keys(tags);
                  const allSubs = Array.from(new Set(relevantTags.flatMap((tg) => tags[tg] ?? [])));
                  return allSubs
                    .filter((s) => !statsSubtagSearch || s.toLowerCase().includes(statsSubtagSearch.toLowerCase()))
                    .map((s) => {
                      const sel = statsFilterSubtags.includes(s);
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setStatsFilterSubtags((prev) => sel ? prev.filter((x) => x !== s) : [...prev, s])}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                            backgroundColor: sel ? theme.primary : theme.inputBg,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "600", color: sel ? "#fff" : theme.textLight }}>{s}</Text>
                        </Pressable>
                      );
                    });
                })()}
              </View>
            </ScrollView>
          </View>

          {(() => {
            const buckets = getStatsBuckets(statsRange);
            if (buckets.length === 0) {
              return (
                <View style={{ paddingVertical: 48, alignItems: "center" }}>
                  <Text style={{ color: theme.textLight, fontSize: 14, textAlign: "center" }}>
                    {t.finances.statsNoData}
                  </Text>
                </View>
              );
            }
            const maxAbs = Math.max(1, ...buckets.map((b) => Math.max(Math.abs(b.income), Math.abs(b.expense))));
            const totalIncome = buckets.reduce((sum, b) => sum + b.income, 0);
            const totalExpense = buckets.reduce((sum, b) => sum + b.expense, 0);
            const chartStyle = {
              opacity: chartAnim,
              transform: [{ translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            };
            const selectedTxs = selectedBucketIndex != null ? buckets[selectedBucketIndex]?.transactions ?? [] : [];

            return (
              <Animated.View style={chartStyle}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.success }} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textLight }}>
                      {t.finances.income}: {formatCurrency(totalIncome)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.danger }} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textLight }}>
                      {t.finances.expenses}: {formatCurrency(totalExpense)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 180, gap: 8, paddingVertical: 12 }}>
                  {buckets.map((b, idx) => {
                    const incomeHeight = (Math.abs(b.income) / maxAbs) * 120;
                    const expenseHeight = (Math.abs(b.expense) / maxAbs) * 120;
                    const isSelected = selectedBucketIndex === idx;
                    return (
                      <Pressable
                        key={b.label}
                        onPress={() => setSelectedBucketIndex(isSelected ? null : idx)}
                        style={{
                          flex: 1, alignItems: "center", justifyContent: "flex-end",
                          opacity: selectedBucketIndex != null && !isSelected ? 0.4 : 1,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 130, gap: 3 }}>
                          <View style={{
                            width: 10, borderRadius: 5, backgroundColor: theme.success,
                            height: Math.max(incomeHeight, 2),
                          }} />
                          <View style={{
                            width: 10, borderRadius: 5, backgroundColor: theme.danger,
                            height: Math.max(expenseHeight, 2),
                          }} />
                        </View>
                        <Text style={{
                          marginTop: 4, fontSize: 10,
                          color: isSelected ? theme.primary : theme.textLight,
                          fontWeight: isSelected ? "700" : "400",
                        }} numberOfLines={1}>
                          {b.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {selectedBucketIndex != null && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, marginBottom: 8 }}>
                      {buckets[selectedBucketIndex].label}
                    </Text>
                    {selectedTxs.length === 0 ? (
                      <Text style={{ fontSize: 13, color: theme.textLight }}>{t.finances.noTransactions}</Text>
                    ) : (
                      selectedTxs.map((item) => {
                        const isIncome = item.type === "income";
                        const isRecurring = item.id.startsWith("rv_");
                        return (
                          <View key={item.id} style={{ marginBottom: 6 }}>
                            <Card theme={theme}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <View style={{
                                  width: 36, height: 36, borderRadius: 18,
                                  backgroundColor: isIncome ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                  alignItems: "center", justifyContent: "center",
                                }}>
                                  {isRecurring
                                    ? <RotateCw size={16} color={isIncome ? theme.success : theme.danger} />
                                    : isIncome
                                      ? <TrendingUp size={16} color={theme.success} />
                                      : <TrendingDown size={16} color={theme.danger} />
                                  }
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>{item.description}</Text>
                                  <Text style={{ fontSize: 11, color: theme.textLight }}>
                                    {item.tag}{item.subtag ? ` · ${item.subtag}` : ""} · {formatDate(item.date)}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: isIncome ? theme.success : theme.danger }}>
                                  {isIncome ? "+" : "-"} {formatCurrency(item.amount)}
                                </Text>
                              </View>
                            </Card>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </Animated.View>
            );
          })()}
        </ScrollView>
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
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingBottom: 20 }}>
          <Pressable
            onPress={() => setShowTransactionModal(true)}
            style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: theme.primary,
              alignItems: "center", justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Plus size={24} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* ============ TRANSACTION MODAL (no recurrence) ============ */}
      <Modal visible={showTransactionModal} transparent animationType="fade" onRequestClose={() => setShowTransactionModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
            onPress={() => { if (!dismissIfVisible()) setShowTransactionModal(false); }}
          >
            <Pressable
              style={{
                width: "100%", maxWidth: 360, backgroundColor: theme.surface,
                borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, maxHeight: "90%",
              }}
              onPress={() => dismissIfVisible()}
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

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.tag}</Text>
              <View style={{ marginBottom: 12, zIndex: 20 }}>
                <TextInput
                  style={{
                    backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                    paddingVertical: 12, fontSize: 14, color: theme.text,
                  }}
                  placeholder={t.finances.tagPlaceholder}
                  placeholderTextColor={theme.inactive}
                  value={showTagDropdown ? tagSearch : newTag}
                  onFocus={() => { setShowTagDropdown(true); setTagSearch(""); }}
                  onChangeText={(text) => { setTagSearch(text); setShowTagDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                />
                {showTagDropdown && (() => {
                  const allTags = Object.keys(tags);
                  const filtered = tagSearch
                    ? allTags.filter((tg) => tg.toLowerCase().includes(tagSearch.toLowerCase()))
                    : allTags;
                  const showCreate = tagSearch.trim() && !allTags.some((tg) => tg.toLowerCase() === tagSearch.toLowerCase());
                  const createLabel = t.finances.createTag;
                  return (
                    <View style={{
                      backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
                      maxHeight: 160, marginTop: 4,
                    }}>
                      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {filtered.map((tg) => (
                          <Pressable key={tg} onPress={() => { setNewTag(tg); setNewSubtag(""); setSubtagSearch(""); setShowTagDropdown(false); }}
                            style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
                            <Text style={{ fontSize: 14, color: newTag === tg ? theme.primary : theme.text, fontWeight: newTag === tg ? "700" : "400" }}>{tg}</Text>
                          </Pressable>
                        ))}
                        {showCreate && (
                          <Pressable onPress={() => { const name = tagSearch.trim(); addTag(name); setNewTag(name); setNewSubtag(""); setTagSearch(""); setShowTagDropdown(false); }}
                            style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Plus size={14} color={theme.primary} />
                            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>{createLabel} &quot;{tagSearch.trim()}&quot;</Text>
                          </Pressable>
                        )}
                      </ScrollView>
                    </View>
                  );
                })()}
              </View>

              <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 6 }}>{t.finances.subtag}</Text>
              <View style={{ marginBottom: 12, zIndex: 10 }}>
                <TextInput
                  style={{
                    backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 16,
                    paddingVertical: 12, fontSize: 14, color: theme.text,
                  }}
                  placeholder={t.finances.subtagPlaceholder}
                  placeholderTextColor={theme.inactive}
                  value={showSubtagDropdown ? subtagSearch : newSubtag}
                  onFocus={() => { setShowSubtagDropdown(true); setSubtagSearch(""); }}
                  onChangeText={(text) => { setSubtagSearch(text); setShowSubtagDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowSubtagDropdown(false), 200)}
                />
                {showSubtagDropdown && (() => {
                  const subtags = tags[newTag] ?? [];
                  const filtered = subtagSearch
                    ? subtags.filter((s) => s.toLowerCase().includes(subtagSearch.toLowerCase()))
                    : subtags;
                  const showCreate = subtagSearch.trim() && !subtags.some((s) => s.toLowerCase() === subtagSearch.toLowerCase());
                  return (
                    <View style={{
                      backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
                      maxHeight: 160, marginTop: 4,
                    }}>
                      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {filtered.length === 0 && !showCreate && (
                          <View style={{ padding: 12 }}>
                            <Text style={{ fontSize: 13, color: theme.textLight, textAlign: "center" }}>—</Text>
                          </View>
                        )}
                        {filtered.map((s) => (
                          <Pressable key={s} onPress={() => { setNewSubtag(s); setSubtagSearch(""); setShowSubtagDropdown(false); }}
                            style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
                            <Text style={{ fontSize: 14, color: newSubtag === s ? theme.primary : theme.text, fontWeight: newSubtag === s ? "700" : "400" }}>{s}</Text>
                          </Pressable>
                        ))}
                        {showCreate && (
                          <Pressable onPress={() => { const name = subtagSearch.trim(); addSubtag(newTag, name); setNewSubtag(name); setSubtagSearch(""); setShowSubtagDropdown(false); }}
                            style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Plus size={14} color={theme.primary} />
                            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>{t.finances.createTag} &quot;{subtagSearch.trim()}&quot;</Text>
                          </Pressable>
                        )}
                      </ScrollView>
                    </View>
                  );
                })()}
              </View>

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
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ RECURRING MODAL ============ */}
      <Modal visible={showRecurringModal} transparent animationType="fade">
        {renderRecurringModalContent()}
      </Modal>

      {/* ============ NEW GOAL MODAL ============ */}
      <Modal visible={showGoalModal} transparent animationType="fade" onRequestClose={() => setShowGoalModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
            onPress={() => { if (!dismissIfVisible()) setShowGoalModal(false); }}
          >
            <Pressable
              style={{
                width: "100%", maxWidth: 360, backgroundColor: theme.surface,
                borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border,
              }}
              onPress={() => dismissIfVisible()}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ CONTRIBUTION MODAL ============ */}
      <Modal visible={showContributionModal !== null} transparent animationType="fade" onRequestClose={() => setShowContributionModal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
            onPress={() => { if (!dismissIfVisible()) setShowContributionModal(null); }}
          >
            <Pressable
              style={{
                width: "100%", maxWidth: 360, backgroundColor: theme.surface,
                borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border,
              }}
              onPress={() => dismissIfVisible()}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ EDIT GOAL MODAL ============ */}
      <Modal visible={showEditGoalModal !== null} transparent animationType="fade" onRequestClose={() => setShowEditGoalModal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
            onPress={() => { if (!dismissIfVisible()) setShowEditGoalModal(null); }}
          >
            <Pressable
              style={{
                width: "100%", maxWidth: 360, backgroundColor: theme.surface,
                borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, maxHeight: "85%",
              }}
              onPress={() => dismissIfVisible()}
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
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
