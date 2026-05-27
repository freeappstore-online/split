export type Currency = "USD" | "EUR" | "GBP" | "AUD";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
};

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export type Category =
  | "food"
  | "transport"
  | "accommodation"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "other";

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "food", label: "Food", icon: "🍔" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "accommodation", label: "Accommodation", icon: "🏠" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "utilities", label: "Utilities", icon: "💡" },
  { id: "other", label: "Other", icon: "📌" },
];

export interface Member {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  /** Total amount in cents */
  amountCents: number;
  paidById: string;
  splitBetween: string[];
  splitType: SplitType;
  /** Per-member split values (cents for exact, percentages for percentage, share counts for shares) */
  splitValues: Record<string, number>;
  date: string;
  category: Category;
  createdAt: string;
}

export interface Settlement {
  id: string;
  fromId: string;
  toId: string;
  amountCents: number;
  date: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  currency: Currency;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  createdAt: string;
}

export interface Debt {
  fromId: string;
  toId: string;
  amountCents: number;
}
