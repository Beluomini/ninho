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
    birdId: "arara",
    email: "lucas@ninho.app",
  },
  {
    id: "u2",
    name: "Marina",
    birdId: "beija-flor",
    email: "marina@ninho.app",
  },
  {
    id: "u3",
    name: "Pedro",
    birdId: "tucano",
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

export const transactions: Transaction[] = [];

export const chores: Chore[] = [
  { id: "c1", title: "Limpar cozinha", assignedTo: ["u3"], dueDate: new Date("2026-03-06"), isCompleted: true, recurrence: "daily" },
  { id: "c2", title: "Lavar banheiro", assignedTo: ["u2"], dueDate: new Date("2026-03-07"), isCompleted: false, recurrence: "weekly" },
  { id: "c3", title: "Aspirar sala", assignedTo: ["u1"], dueDate: new Date("2026-03-06"), isCompleted: false, recurrence: "weekly" },
  { id: "c4", title: "Levar lixo para fora", assignedTo: ["u3"], dueDate: new Date("2026-03-06"), isCompleted: false, recurrence: "daily" },
  { id: "c5", title: "Lavar roupas", assignedTo: ["u1", "u2"], dueDate: new Date("2026-03-08"), isCompleted: false, recurrence: "weekly" },
  { id: "c6", title: "Organizar despensa", assignedTo: ["u2"], dueDate: new Date("2026-03-10"), isCompleted: false, recurrence: "monthly" },
];
