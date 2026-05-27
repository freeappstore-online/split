import { useState } from "react";
import type { Member } from "../lib/types";
import { generateId } from "../lib/storage";

interface MemberManagerProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onRemoveMember: (id: string) => void;
  /** If true, disable removing members (e.g., members referenced in expenses) */
  hasExpenses: boolean;
}

export default function MemberManager({
  members,
  onAddMember,
  onRemoveMember,
  hasExpenses,
}: MemberManagerProps) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A member with that name already exists");
      return;
    }
    onAddMember({ id: generateId(), name: trimmed });
    setName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
        Members ({members.length})
      </h3>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Add member name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            outline: "none",
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium cursor-pointer"
          style={{
            background: name.trim() ? "var(--accent)" : "var(--panel)",
            color: name.trim() ? "#fff" : "var(--muted)",
            border: "1px solid var(--line)",
          }}
        >
          Add
        </button>
      </div>
      {members.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Add members to start tracking expenses
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
              }}
            >
              <span>{m.name}</span>
              {!hasExpenses && (
                <button
                  onClick={() => onRemoveMember(m.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full text-xs cursor-pointer"
                  style={{
                    background: "var(--line)",
                    border: "none",
                    color: "var(--muted)",
                  }}
                  title="Remove member"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
