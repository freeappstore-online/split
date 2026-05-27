import { useState, useCallback } from "react";
import type { Group, Member, Expense, Settlement } from "../lib/types";
import MemberManager from "./MemberManager";
import AddExpense from "./AddExpense";
import ExpenseList from "./ExpenseList";
import Balances from "./Balances";
import Summary from "./Summary";

type Tab = "expenses" | "balances" | "summary";

interface GroupViewProps {
  group: Group;
  onUpdateGroup: (group: Group) => void;
  onBack: () => void;
}

export default function GroupView({ group, onUpdateGroup, onBack }: GroupViewProps) {
  const [tab, setTab] = useState<Tab>("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const updateGroup = useCallback(
    (updates: Partial<Group>) => {
      onUpdateGroup({ ...group, ...updates });
    },
    [group, onUpdateGroup],
  );

  const handleAddMember = useCallback(
    (member: Member) => {
      updateGroup({ members: [...group.members, member] });
    },
    [group.members, updateGroup],
  );

  const handleRemoveMember = useCallback(
    (id: string) => {
      updateGroup({ members: group.members.filter((m) => m.id !== id) });
    },
    [group.members, updateGroup],
  );

  const handleAddExpense = useCallback(
    (expense: Expense) => {
      if (editingExpense) {
        // Replace existing
        updateGroup({
          expenses: group.expenses.map((e) => (e.id === expense.id ? expense : e)),
        });
        setEditingExpense(null);
      } else {
        updateGroup({ expenses: [...group.expenses, expense] });
      }
      setShowAddExpense(false);
    },
    [editingExpense, group.expenses, updateGroup],
  );

  const handleDeleteExpense = useCallback(
    (id: string) => {
      updateGroup({ expenses: group.expenses.filter((e) => e.id !== id) });
    },
    [group.expenses, updateGroup],
  );

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowAddExpense(true);
    setTab("expenses");
  }, []);

  const handleSettle = useCallback(
    (settlement: Settlement) => {
      updateGroup({ settlements: [...group.settlements, settlement] });
    },
    [group.settlements, updateGroup],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "expenses", label: "Expenses" },
    { id: "balances", label: "Balances" },
    { id: "summary", label: "Summary" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
          aria-label="Back to groups"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            {group.name}
          </h2>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {group.currency} · {group.members.length} member{group.members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Member management */}
      <MemberManager
        members={group.members}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        hasExpenses={group.expenses.length > 0}
      />

      {/* Tabs */}
      {group.members.length >= 2 && (
        <>
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--line)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setShowAddExpense(false);
                  setEditingExpense(null);
                }}
                className="flex-1 py-2 text-xs font-semibold cursor-pointer transition-colors"
                style={{
                  background: tab === t.id ? "var(--accent)" : "var(--panel)",
                  color: tab === t.id ? "#fff" : "var(--ink)",
                  border: "none",
                }}
              >
                {t.label}
                {t.id === "expenses" && group.expenses.length > 0 && (
                  <span className="ml-1 opacity-70">({group.expenses.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Add expense button */}
          {tab === "expenses" && !showAddExpense && (
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowAddExpense(true);
              }}
              className="w-full py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
              }}
            >
              + Add Expense
            </button>
          )}

          {/* Tab content */}
          {tab === "expenses" && showAddExpense && (
            <AddExpense
              members={group.members}
              currency={group.currency}
              onAddExpense={handleAddExpense}
              onCancel={() => {
                setShowAddExpense(false);
                setEditingExpense(null);
              }}
              editExpense={editingExpense}
            />
          )}

          {tab === "expenses" && !showAddExpense && (
            <ExpenseList
              expenses={group.expenses}
              members={group.members}
              currency={group.currency}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {tab === "balances" && (
            <Balances
              members={group.members}
              expenses={group.expenses}
              settlements={group.settlements}
              currency={group.currency}
              onSettle={handleSettle}
            />
          )}

          {tab === "summary" && (
            <Summary
              expenses={group.expenses}
              members={group.members}
              currency={group.currency}
            />
          )}
        </>
      )}

      {group.members.length < 2 && group.members.length > 0 && (
        <div
          className="text-center py-6 rounded-xl"
          style={{ background: "var(--panel)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Add at least 2 members to start tracking expenses
          </p>
        </div>
      )}
    </div>
  );
}
