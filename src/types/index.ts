export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
}

export interface House {
  id: string;
  name: string;
  members: User[];
  createdAt: Date;
}

export type MessageMediaType = "text" | "image" | "audio" | "video";

export interface Message {
  id: string;
  authorId: string;
  content: string;
  mediaType: MessageMediaType;
  mediaUrl?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  description: string;
  type: "shopping" | "chore" | "finance" | "general";
  createdAt: Date;
}

export type ShoppingCategory =
  | "dairy"
  | "meat"
  | "produce"
  | "bakery"
  | "beverages"
  | "cleaning"
  | "other";

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: string;
  isCompleted: boolean;
  addedBy: string;
  completedBy?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  paidBy: string;
  type: "income" | "expense" | "investment";
}

export interface Chore {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: Date;
  isCompleted: boolean;
  recurrence: "daily" | "weekly" | "monthly" | "once";
}
