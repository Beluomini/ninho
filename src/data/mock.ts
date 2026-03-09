import type {
  User,
  House,
  Message,
  ShoppingItem,
  Transaction,
  Chore,
} from "../types";

export const users: User[] = [
  {
    id: "u1",
    name: "Lucas",
    avatarUrl: "https://i.pravatar.cc/150?u=lucas",
    email: "lucas@ninho.app",
  },
  {
    id: "u2",
    name: "Marina",
    avatarUrl: "https://i.pravatar.cc/150?u=marina",
    email: "marina@ninho.app",
  },
  {
    id: "u3",
    name: "Pedro",
    avatarUrl: "https://i.pravatar.cc/150?u=pedro",
    email: "pedro@ninho.app",
  },
];

export const house: House = {
  id: "h1",
  name: "Casa Verde",
  members: users,
  createdAt: new Date("2025-01-15"),
};

export const latestMessage: Message = {
  id: "m1",
  authorId: "u3",
  content: "Amanha tenho visita, vou precisar da sala arrumada.",
  mediaType: "text",
  createdAt: new Date("2026-03-06T09:00:00"),
};

export const shoppingItems: ShoppingItem[] = [
  { id: "s1", name: "Leite Integral", category: "dairy", quantity: 2, unit: "L", isCompleted: false, addedBy: "u2" },
  { id: "s2", name: "Queijo Mussarela", category: "dairy", quantity: 300, unit: "g", isCompleted: false, addedBy: "u1" },
  { id: "s3", name: "Peito de Frango", category: "meat", quantity: 1, unit: "kg", isCompleted: false, addedBy: "u3" },
  { id: "s4", name: "Banana", category: "produce", quantity: 6, unit: "un", isCompleted: false, addedBy: "u2" },
  { id: "s5", name: "Tomate", category: "produce", quantity: 4, unit: "un", isCompleted: false, addedBy: "u1" },
  { id: "s6", name: "Pao Frances", category: "bakery", quantity: 10, unit: "un", isCompleted: true, addedBy: "u3", completedBy: "u1" },
  { id: "s7", name: "Cafe em Po", category: "beverages", quantity: 500, unit: "g", isCompleted: false, addedBy: "u1" },
  { id: "s8", name: "Suco de Laranja", category: "beverages", quantity: 1, unit: "L", isCompleted: false, addedBy: "u2" },
  { id: "s9", name: "Detergente", category: "cleaning", quantity: 2, unit: "un", isCompleted: true, addedBy: "u1", completedBy: "u2" },
  { id: "s10", name: "Esponja", category: "cleaning", quantity: 3, unit: "un", isCompleted: false, addedBy: "u3" },
  { id: "s11", name: "Papel Toalha", category: "other", quantity: 2, unit: "un", isCompleted: true, addedBy: "u2", completedBy: "u1" },
  { id: "s12", name: "Manteiga", category: "dairy", quantity: 1, unit: "un", isCompleted: false, addedBy: "u1" },
  { id: "s13", name: "Alface", category: "produce", quantity: 1, unit: "un", isCompleted: false, addedBy: "u3" },
  { id: "s14", name: "Carne Moida", category: "meat", quantity: 500, unit: "g", isCompleted: false, addedBy: "u2" },
  { id: "s15", name: "Agua Sanitaria", category: "cleaning", quantity: 1, unit: "L", isCompleted: false, addedBy: "u1" },
];

export const transactions: Transaction[] = [
  { id: "t1", description: "Aluguel", amount: -2400, category: "Moradia", date: new Date("2026-03-01"), paidBy: "u1", type: "expense" },
  { id: "t2", description: "Conta de Luz", amount: -187.5, category: "Utilidades", date: new Date("2026-03-04"), paidBy: "u1", type: "expense" },
  { id: "t3", description: "Conta de Agua", amount: -95.3, category: "Utilidades", date: new Date("2026-03-03"), paidBy: "u2", type: "expense" },
  { id: "t4", description: "Internet", amount: -120, category: "Utilidades", date: new Date("2026-03-01"), paidBy: "u3", type: "expense" },
  { id: "t5", description: "Contribuicao mensal - Lucas", amount: 1500, category: "Renda", date: new Date("2026-03-01"), paidBy: "u1", type: "income" },
  { id: "t6", description: "Contribuicao mensal - Marina", amount: 1500, category: "Renda", date: new Date("2026-03-01"), paidBy: "u2", type: "income" },
  { id: "t7", description: "Contribuicao mensal - Pedro", amount: 1500, category: "Renda", date: new Date("2026-03-01"), paidBy: "u3", type: "income" },
  { id: "t8", description: "Supermercado", amount: -347.8, category: "Alimentacao", date: new Date("2026-03-02"), paidBy: "u2", type: "expense" },
];

export const chores: Chore[] = [
  { id: "c1", title: "Limpar cozinha", assignedTo: "u3", dueDate: new Date("2026-03-06"), isCompleted: true, recurrence: "daily" },
  { id: "c2", title: "Lavar banheiro", assignedTo: "u2", dueDate: new Date("2026-03-07"), isCompleted: false, recurrence: "weekly" },
  { id: "c3", title: "Aspirar sala", assignedTo: "u1", dueDate: new Date("2026-03-06"), isCompleted: false, recurrence: "weekly" },
  { id: "c4", title: "Levar lixo para fora", assignedTo: "u3", dueDate: new Date("2026-03-06"), isCompleted: false, recurrence: "daily" },
  { id: "c5", title: "Lavar roupas", assignedTo: "u1", dueDate: new Date("2026-03-08"), isCompleted: false, recurrence: "weekly" },
  { id: "c6", title: "Organizar despensa", assignedTo: "u2", dueDate: new Date("2026-03-10"), isCompleted: false, recurrence: "monthly" },
];
