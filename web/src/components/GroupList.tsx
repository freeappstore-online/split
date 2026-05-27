import type { Group, Currency } from "../lib/types";
import { CURRENCY_SYMBOLS } from "../lib/types";
import { formatMoney, formatDate } from "../lib/format";
import { generateId } from "../lib/storage";

interface GroupListProps {
  groups: Group[];
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onSelectGroup: (id: string) => void;
  onCreateGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
}

export default function GroupList({
  groups,
  currency,
  onCurrencyChange,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
}: GroupListProps) {
  const handleCreateGroup = () => {
    const name = prompt("Group name:");
    if (!name?.trim()) return;

    const group: Group = {
      id: generateId(),
      name: name.trim(),
      currency,
      members: [],
      expenses: [],
      settlements: [],
      createdAt: new Date().toISOString(),
    };
    onCreateGroup(group);
    onSelectGroup(group.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Groups
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="text-sm rounded-lg px-3 py-1.5 font-medium cursor-pointer"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer"
            style={{ background: "var(--accent)", color: "#fff", border: "none" }}
          >
            + New Group
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ background: "var(--panel)" }}
        >
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            No groups yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Create a group to start tracking shared expenses
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const totalSpent = group.expenses.reduce(
              (sum, e) => sum + e.amountCents,
              0,
            );
            return (
              <div
                key={group.id}
                className="rounded-xl p-4 cursor-pointer transition-colors"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
                onClick={() => onSelectGroup(group.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--ink)" }}>
                      {group.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                      {" · "}
                      {group.expenses.length} expense{group.expenses.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                      {formatMoney(totalSpent, group.currency)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatDate(group.createdAt.split("T")[0] ?? "")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {group.members.slice(0, 5).map((m) => (
                      <span
                        key={m.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--paper)",
                          color: "var(--muted)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {m.name}
                      </span>
                    ))}
                    {group.members.length > 5 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--paper)",
                          color: "var(--muted)",
                        }}
                      >
                        +{group.members.length - 5}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete group "${group.name}"?`)) {
                        onDeleteGroup(group.id);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded-lg cursor-pointer"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
