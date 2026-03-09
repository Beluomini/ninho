import { useState, useCallback } from "react";
import type {
  User,
  House,
  Message,
  MessageMediaType,
  ShoppingItem,
  Transaction,
  Chore,
} from "../types";
import * as mock from "../data/mock";

export function useHouseData() {
  const [house] = useState<House>(mock.house);
  const [currentUser] = useState<User>(mock.users[0]);
  const [latestMessage, setLatestMessage] = useState<Message>(mock.latestMessage);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(mock.shoppingItems);
  const [transactions, setTransactions] = useState<Transaction[]>(mock.transactions);
  const [chores, setChores] = useState<Chore[]>(mock.chores);

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
    (title: string, assignedTo: string, dueDate: Date, recurrence: ChoreRecurrence) => {
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

  const clearAllChores = useCallback(() => {
    setChores([]);
  }, []);

  const clearCompletedChores = useCallback(() => {
    setChores((prev) => prev.filter((c) => !c.isCompleted));
  }, []);

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    house,
    currentUser,
    latestMessage,
    shoppingItems,
    transactions,
    chores,
    balance,
    getUserById,
    postMessage,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    addTransaction,
    toggleChore,
    addChore,
    clearAllChores,
    clearCompletedChores,
  };
}
