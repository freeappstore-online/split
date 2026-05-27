import { useState, useMemo } from "react";
import type { Expense, Member, Category, Currency } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { formatMoney, formatDate } from "../lib/format";

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  currency: Currency;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseList({
  expenses,
  members,
  currency,
  onEditExpense,
  onDeleteExpense,
}: ExpenseListProps) {
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPayer, setFilterPayer] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const getMemberName = (id: string): string =>
    members.find((m) => m.id === id)?.name ?? "Unknown";

  const getCategoryInfo = (id: Category) =>
    CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;

  const filtered = useMemo(() => {
    let result = [...expenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (filterCategory !== "all") {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (filterPayer !== "all") {
      result = result.filter((e) => e.paidById === filterPayer);
    }
    if (filterDateFrom) {
      result = result.filter((e) => e.date >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter((e) => e.date <= filterDateTo);
    }
    return result;
  }, [expenses, filterCategory, filterPayer, filterDateFrom, filterDateTo]);

  const runningTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amountCents, 0),
    [filtered],
  );

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No expenses yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | "all")}
            className="text-xs rounded-lg px-2 py-1.5 cursor-pointer"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterPayer}
            onChange={(e) => setFilterPayer(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 cursor-pointer"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            <option value="all">All payers</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder="From"
            className="text-xs rounded-lg px-2 py-1.5"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            placeholder="To"
            className="text-xs rounded-lg px-2 py-1.5"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--muted)" }}>
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            Total: {formatMoney(runningTotal, currency)}
          </span>
        </div>
      </div>

      {/* Expense items */}
      <div className="space-y-2">
        {filtered.map((expense) => {
          const catInfo = getCategoryInfo(expense.category);
          return (
            <div
              key={expense.id}
              className="rounded-lg p-3"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">{catInfo.icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                      {expense.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      Paid by {getMemberName(expense.paidById)} · {formatDate(expense.date)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Split {expense.splitType} between{" "}
                      {expense.splitBetween.length} {expense.splitBetween.length === 1 ? "person" : "people"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {formatMoney(expense.amountCents, currency)}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="text-xs px-2 py-0.5 rounded cursor-pointer"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--line)",
                        color: "var(--accent)",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this expense?")) {
                          onDeleteExpense(expense.id);
                        }
                      }}
                      className="text-xs px-2 py-0.5 rounded cursor-pointer"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--line)",
                        color: "var(--error)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
