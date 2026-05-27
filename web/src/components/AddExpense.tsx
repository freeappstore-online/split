import { useState, useMemo } from "react";
import type { Member, Expense, SplitType, Category, Currency } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { CURRENCY_SYMBOLS } from "../lib/types";
import { parseToCents, centsToInputValue, todayString } from "../lib/format";
import { validateSplit } from "../lib/splitting";
import { generateId } from "../lib/storage";

interface AddExpenseProps {
  members: Member[];
  currency: Currency;
  onAddExpense: (expense: Expense) => void;
  onCancel: () => void;
  /** Expense to edit, or null for new */
  editExpense?: Expense | null;
}

export default function AddExpense({
  members,
  currency,
  onAddExpense,
  onCancel,
  editExpense,
}: AddExpenseProps) {
  const [description, setDescription] = useState(editExpense?.description ?? "");
  const [amountInput, setAmountInput] = useState(
    editExpense ? centsToInputValue(editExpense.amountCents) : "",
  );
  const [paidById, setPaidById] = useState(editExpense?.paidById ?? (members[0]?.id ?? ""));
  const [splitBetween, setSplitBetween] = useState<Set<string>>(
    new Set(editExpense?.splitBetween ?? members.map((m) => m.id)),
  );
  const [splitType, setSplitType] = useState<SplitType>(editExpense?.splitType ?? "equal");
  const [splitValues, setSplitValues] = useState<Record<string, number>>(
    editExpense?.splitValues ?? {},
  );
  const [date, setDate] = useState(editExpense?.date ?? todayString());
  const [category, setCategory] = useState<Category>(editExpense?.category ?? "other");

  const amountCents = parseToCents(amountInput);

  const toggleMember = (id: string) => {
    const next = new Set(splitBetween);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSplitBetween(next);
  };

  const selectAll = () => setSplitBetween(new Set(members.map((m) => m.id)));
  const selectNone = () => setSplitBetween(new Set());

  const updateSplitValue = (memberId: string, value: number) => {
    setSplitValues((prev) => ({ ...prev, [memberId]: value }));
  };

  const validationError = useMemo(() => {
    if (!description.trim()) return "Enter a description";
    if (amountCents <= 0) return "Enter an amount";
    if (!paidById) return "Select who paid";
    return validateSplit(splitType, amountCents, [...splitBetween], splitValues);
  }, [description, amountCents, paidById, splitType, splitBetween, splitValues]);

  const handleSubmit = () => {
    if (validationError) return;

    const expense: Expense = {
      id: editExpense?.id ?? generateId(),
      description: description.trim(),
      amountCents,
      paidById,
      splitBetween: [...splitBetween],
      splitType,
      splitValues: splitType === "equal" ? {} : { ...splitValues },
      date,
      category,
      createdAt: editExpense?.createdAt ?? new Date().toISOString(),
    };
    onAddExpense(expense);
  };

  const splitTypeOptions: { value: SplitType; label: string }[] = [
    { value: "equal", label: "Equal" },
    { value: "exact", label: "Exact" },
    { value: "percentage", label: "Percentage" },
    { value: "shares", label: "Shares" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          {editExpense ? "Edit Expense" : "Add Expense"}
        </h3>
        <button
          onClick={onCancel}
          className="text-sm px-3 py-1 rounded-lg cursor-pointer"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--muted)",
          }}
        >
          Cancel
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
          Description
        </label>
        <input
          type="text"
          placeholder="e.g., Dinner at Mario's"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            outline: "none",
          }}
        />
      </div>

      {/* Amount + Date row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
            Amount
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--muted)" }}
            >
              {CURRENCY_SYMBOLS[currency]}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full rounded-lg pl-8 pr-3 py-2 text-sm"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{
                background: category === cat.id ? "var(--accent)" : "var(--panel)",
                color: category === cat.id ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Paid by */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
          Paid by
        </label>
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm cursor-pointer"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Split between */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Split between
          </label>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs cursor-pointer"
              style={{ background: "none", border: "none", color: "var(--accent)" }}
            >
              All
            </button>
            <button
              onClick={selectNone}
              className="text-xs cursor-pointer"
              style={{ background: "none", border: "none", color: "var(--muted)" }}
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMember(m.id)}
              className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
              style={{
                background: splitBetween.has(m.id)
                  ? "var(--accent)"
                  : "var(--panel)",
                color: splitBetween.has(m.id) ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Split type */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
          Split type
        </label>
        <div className="flex gap-1.5">
          {splitTypeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSplitType(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{
                background: splitType === opt.value ? "var(--accent)" : "var(--panel)",
                color: splitType === opt.value ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Per-member split inputs (for non-equal types) */}
      {splitType !== "equal" && splitBetween.size > 0 && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            {splitType === "exact"
              ? `Enter exact amounts (${CURRENCY_SYMBOLS[currency]})`
              : splitType === "percentage"
                ? "Enter percentages (must sum to 100%)"
                : "Enter share counts"}
          </p>
          {members
            .filter((m) => splitBetween.has(m.id))
            .map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-xs font-medium w-24 truncate" style={{ color: "var(--ink)" }}>
                  {m.name}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={splitType === "shares" ? "1" : "0"}
                  value={splitValues[m.id] ?? ""}
                  onChange={(e) => {
                    const val = splitType === "exact"
                      ? parseToCents(e.target.value)
                      : parseFloat(e.target.value) || 0;
                    updateSplitValue(m.id, val);
                  }}
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm"
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    outline: "none",
                  }}
                />
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {splitType === "exact"
                    ? CURRENCY_SYMBOLS[currency]
                    : splitType === "percentage"
                      ? "%"
                      : "shares"}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Validation + Submit */}
      {validationError && (
        <p className="text-xs" style={{ color: "var(--error)" }}>
          {validationError}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!!validationError}
        className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
        style={{
          background: validationError ? "var(--panel)" : "var(--accent)",
          color: validationError ? "var(--muted)" : "#fff",
          border: "1px solid var(--line)",
        }}
      >
        {editExpense ? "Save Changes" : "Add Expense"}
      </button>
    </div>
  );
}
