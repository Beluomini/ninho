import { View, Text, FlatList, Pressable, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react-native";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { TabSelector } from "../../src/components/ui/TabSelector";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";

export default function FinancesScreen() {
  const { transactions, balance, addTransaction } = useHouseData();
  const { t } = useSettings();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");

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

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleCreate = () => {
    const amount = parseFloat(newAmount.replace(",", "."));
    if (!newDesc.trim() || isNaN(amount)) return;
    addTransaction({
      description: newDesc.trim(),
      amount: newType === "expense" ? -Math.abs(amount) : Math.abs(amount),
      category: "Geral",
      date: new Date(),
      type: newType,
    });
    setNewDesc("");
    setNewAmount("");
    setShowModal(false);
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>
          {t.finances.title}
        </Text>
      </View>

      {/* Balance card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{
          backgroundColor: theme.primary, borderRadius: 16, padding: 20,
        }}>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
            {t.finances.currentBalance}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>
            {formatCurrency(balance)}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 16, gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ArrowUpCircle size={18} color="#22C55E" />
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.finances.income}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                  {formatCurrency(incomeTotal)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ArrowDownCircle size={18} color="#EF4444" />
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.finances.expenses}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                  {formatCurrency(expenseTotal)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TabSelector
          tabs={[t.finances.overview, t.finances.statistics, t.finances.archive]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
        />
      </View>

      {/* Transactions list */}
      {activeTab === 0 && (
        <FlatList
          data={sortedTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const isIncome = item.type === "income";
            return (
              <Card theme={theme}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: isIncome ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {isIncome ? (
                      <TrendingUp size={18} color={theme.success} />
                    ) : (
                      <TrendingDown size={18} color={theme.danger} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                      {item.description}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textLight }}>
                      {item.category} - {formatDate(item.date)}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 14, fontWeight: "700",
                    color: isIncome ? theme.success : theme.danger,
                  }}>
                    {isIncome ? "+" : "-"} {formatCurrency(item.amount)}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      )}

      {activeTab === 1 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <Text style={{ color: theme.textLight, fontSize: 14, textAlign: "center" }}>
            {t.finances.statsPlaceholder}
          </Text>
        </View>
      )}

      {activeTab === 2 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <Text style={{ color: theme.textLight, fontSize: 14, textAlign: "center" }}>
            {t.finances.archivePlaceholder}
          </Text>
        </View>
      )}

      {/* FAB */}
      <View style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}>
        <Pressable
          onPress={() => setShowModal(true)}
          style={{
            backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Plus size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            {t.finances.newExpense}
          </Text>
        </Pressable>
      </View>

      {/* New transaction modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>
                {t.finances.newTransaction}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <X size={22} color={theme.inactive} />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <Pressable
                onPress={() => setNewType("expense")}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: newType === "expense" ? "rgba(239,68,68,0.15)" : theme.inputBg,
                }}
              >
                <Text style={{
                  fontSize: 14, fontWeight: "600",
                  color: newType === "expense" ? theme.danger : theme.textLight,
                }}>
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
                <Text style={{
                  fontSize: 14, fontWeight: "600",
                  color: newType === "income" ? theme.success : theme.textLight,
                }}>
                  {t.finances.incomeType}
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                fontSize: 14, color: theme.text, marginBottom: 12,
              }}
              placeholder={t.finances.description}
              placeholderTextColor={theme.inactive}
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <TextInput
              style={{
                backgroundColor: theme.inputBg, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                fontSize: 14, color: theme.text, marginBottom: 16,
              }}
              placeholder={t.finances.amount}
              placeholderTextColor={theme.inactive}
              keyboardType="numeric"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <Pressable
              onPress={handleCreate}
              style={{ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{t.finances.save}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
