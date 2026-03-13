import { useState, useCallback } from "react";
import type {
  User,
  House,
  Message,
  MessageMediaType,
  ShoppingItem,
  Transaction,
  Chore,
  RecurringItem,
  InvestmentGoal,
  TagMap,
} from "../types";
import * as mock from "../data/mock";

export function useHouseData() {
  const [house] = useState<House>(mock.house);
  const [currentUser] = useState<User>(mock.users[0]);
  const [latestMessage, setLatestMessage] = useState<Message>(mock.latestMessage);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(mock.shoppingItems);
  const [transactions, setTransactions] = useState<Transaction[]>(mock.transactions);
  const [chores, setChores] = useState<Chore[]>(mock.chores);
  const [initialBalance, setInitialBalanceState] = useState<number>(0);
  const [onboardingDone, setOnboardingDoneState] = useState<boolean>(false);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [investmentGoals, setInvestmentGoals] = useState<InvestmentGoal[]>([]);
  const [tags, setTags] = useState<TagMap>({
    Geral: [],
    Moradia: ["Aluguel", "Condomínio", "IPTU"],
    Utilidades: ["Energia", "Água", "Internet", "Gás"],
    Alimentação: ["Mercado", "Restaurante", "Delivery"],
    Renda: ["Salário", "Freelance", "Investimento"],
    Transporte: ["Combustível", "Uber", "Ônibus", "Manutenção"],
    Lazer: ["Cinema", "Viagem", "Streaming"],
    Saúde: ["Consulta", "Medicamento", "Plano de saúde"],
  });

  const getUserById = useCallback(
    (id: string) => house.members.find((u) => u.id === id),
    [house.members]
  );

  const postMessage = useCallback(
    (content: string, mediaType: MessageMediaType = "text", mediaUrl?: string) => {
      setLatestMessage({
        id: `m${Date.now()}`,
        authorId: currentUser.id,
        content,
        mediaType,
        mediaUrl,
        createdAt: new Date(),
      });
    },
    [currentUser]
  );

  const addShoppingItem = useCallback(
    (name: string) => {
      const item: ShoppingItem = {
        id: `s${Date.now()}`,
        name,
        category: "other",
        quantity: 1,
        unit: "un",
        isCompleted: false,
        addedBy: currentUser.id,
      };
      setShoppingItems((prev) => [item, ...prev]);
    },
    [currentUser]
  );

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addTransaction = useCallback(
    (data: Omit<Transaction, "id" | "paidBy">) => {
      const tx: Transaction = {
        ...data,
        id: `t${Date.now()}`,
        paidBy: currentUser.id,
      };
      setTransactions((prev) => [tx, ...prev]);
    },
    [currentUser]
  );

  const toggleChore = useCallback((id: string) => {
    setChores((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isCompleted: !c.isCompleted } : c
      )
    );
  }, []);

  type ChoreRecurrence = Chore["recurrence"];

  const addChore = useCallback(
    (title: string, assignedTo: string[], dueDate: Date, recurrence: ChoreRecurrence) => {
      const chore: Chore = {
        id: `c${Date.now()}`,
        title,
        assignedTo,
        dueDate,
        isCompleted: false,
        recurrence,
      };
      setChores((prev) => [chore, ...prev]);
    },
    []
  );

  const removeChore = useCallback((id: string) => {
    setChores((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAllChores = useCallback(() => {
    setChores([]);
  }, []);

  const clearCompletedChores = useCallback(() => {
    setChores((prev) => prev.filter((c) => !c.isCompleted));
  }, []);

  const setInitialBalance = useCallback((value: number) => {
    setInitialBalanceState(value);
  }, []);

  const setOnboardingDone = useCallback((done: boolean) => {
    setOnboardingDoneState(done);
  }, []);

  const addRecurringItem = useCallback(
    (data: Omit<RecurringItem, "id">) => {
      const item: RecurringItem = {
        ...data,
        id: `r${Date.now()}`,
      };
      setRecurringItems((prev) => [...prev, item]);
    },
    []
  );

  const removeRecurringItem = useCallback((id: string) => {
    setRecurringItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addInvestmentGoal = useCallback(
    (name: string, targetAmount?: number) => {
      const goal: InvestmentGoal = {
        id: `g${Date.now()}`,
        name,
        currentAmount: 0,
        targetAmount,
        contributions: [],
      };
      setInvestmentGoals((prev) => [...prev, goal]);
    },
    []
  );

  const addInvestmentContribution = useCallback((goalId: string, amount: number) => {
    setInvestmentGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const contribution = { id: `ic${Date.now()}`, amount, date: new Date() };
        return {
          ...g,
          currentAmount: g.currentAmount + amount,
          contributions: [...g.contributions, contribution],
        };
      })
    );
  }, []);

  const removeInvestmentContribution = useCallback((goalId: string, contributionId: string) => {
    setInvestmentGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const contrib = g.contributions.find((c) => c.id === contributionId);
        if (!contrib) return g;
        return {
          ...g,
          currentAmount: g.currentAmount - contrib.amount,
          contributions: g.contributions.filter((c) => c.id !== contributionId),
        };
      })
    );
  }, []);

  const updateInvestmentGoal = useCallback(
    (goalId: string, updates: { name?: string; targetAmount?: number }) => {
      setInvestmentGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
      );
    },
    []
  );

  const removeInvestmentGoal = useCallback((id: string) => {
    setInvestmentGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const markGoalReachedShown = useCallback((goalId: string) => {
    setInvestmentGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, goalReachedShown: true } : g))
    );
  }, []);

  const addTag = useCallback((tagName: string) => {
    setTags((prev) => {
      if (prev[tagName] !== undefined) return prev;
      return { ...prev, [tagName]: [] };
    });
  }, []);

  const addSubtag = useCallback((tagName: string, subtagName: string) => {
    setTags((prev) => {
      const existing = prev[tagName] ?? [];
      if (existing.includes(subtagName)) return prev;
      return { ...prev, [tagName]: [...existing, subtagName] };
    });
  }, []);

  const balance = onboardingDone
    ? initialBalance + transactions.reduce((sum, t) => sum + t.amount, 0)
    : 0;

  return {
    house,
    currentUser,
    latestMessage,
    shoppingItems,
    transactions,
    chores,
    balance,
    initialBalance,
    onboardingDone,
    recurringItems,
    investmentGoals,
    getUserById,
    postMessage,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    addTransaction,
    toggleChore,
    addChore,
    removeChore,
    clearAllChores,
    clearCompletedChores,
    setInitialBalance,
    setOnboardingDone,
    addRecurringItem,
    removeRecurringItem,
    removeTransaction,
    addInvestmentGoal,
    addInvestmentContribution,
    removeInvestmentContribution,
    updateInvestmentGoal,
    removeInvestmentGoal,
    markGoalReachedShown,
    tags,
    addTag,
    addSubtag,
  };
}
