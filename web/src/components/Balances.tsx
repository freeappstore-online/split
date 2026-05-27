import { useMemo } from "react";
import type { Member, Expense, Settlement, Currency } from "../lib/types";
import { calculateBalances, simplifyDebts } from "../lib/debts";
import { formatMoney, todayString } from "../lib/format";
import { generateId } from "../lib/storage";

interface BalancesProps {
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  currency: Currency;
  onSettle: (settlement: Settlement) => void;
}

export default function Balances({
  members,
  expenses,
  settlements,
  currency,
  onSettle,
}: BalancesProps) {
  const memberIds = members.map((m) => m.id);

  const balances = useMemo(
    () => calculateBalances(expenses, settlements, memberIds),
    [expenses, settlements, memberIds],
  );

  const debts = useMemo(() => simplifyDebts(balances), [balances]);

  const maxAbsBalance = useMemo(() => {
    let max = 0;
    for (const val of Object.values(balances)) {
      if (Math.abs(val) > max) max = Math.abs(val);
    }
    return max || 1;
  }, [balances]);

  const getMemberName = (id: string): string =>
    members.find((m) => m.id === id)?.name ?? "Unknown";

  const handleSettle = (fromId: string, toId: string, amountCents: number) => {
    if (!confirm(`Mark ${getMemberName(fromId)} paying ${formatMoney(amountCents, currency)} to ${getMemberName(toId)}?`)) {
      return;
    }
    onSettle({
      id: generateId(),
      fromId,
      toId,
      amountCents,
      date: todayString(),
      createdAt: new Date().toISOString(),
    });
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Add members to see balances
        </p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Add expenses to see balances
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Net balances */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
          Net Balances
        </h3>
        <div className="space-y-2">
          {members.map((m) => {
            const balance = balances[m.id] ?? 0;
            const isPositive = balance > 0;
            const isNeutral = Math.abs(balance) < 1;
            const barWidth = isNeutral ? 0 : (Math.abs(balance) / maxAbsBalance) * 100;

            return (
              <div
                key={m.id}
                className="rounded-lg p-3"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                    {m.name}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: isNeutral
                        ? "var(--muted)"
                        : isPositive
                          ? "var(--success)"
                          : "var(--error)",
                    }}
                  >
                    {isNeutral
                      ? "Settled"
                      : isPositive
                        ? `+${formatMoney(balance, currency)}`
                        : formatMoney(balance, currency)}
                  </span>
                </div>
                {!isNeutral && (
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--line)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        background: isPositive ? "var(--success)" : "var(--error)",
                      }}
                    />
                  </div>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {isNeutral
                    ? "All settled up"
                    : isPositive
                      ? "Is owed money"
                      : "Owes money"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified debts */}
      {debts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
            Settle Up ({debts.length} payment{debts.length !== 1 ? "s" : ""})
          </h3>
          <div className="space-y-2">
            {debts.map((debt, i) => (
              <div
                key={`${debt.fromId}-${debt.toId}-${i}`}
                className="flex items-center justify-between rounded-lg p-3"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium" style={{ color: "var(--error)" }}>
                    {getMemberName(debt.fromId)}
                  </span>
                  <svg className="w-4 h-4" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span className="font-medium" style={{ color: "var(--success)" }}>
                    {getMemberName(debt.toId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {formatMoney(debt.amountCents, currency)}
                  </span>
                  <button
                    onClick={() => handleSettle(debt.fromId, debt.toId, debt.amountCents)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
                    style={{
                      background: "var(--success)",
                      color: "#fff",
                      border: "none",
                    }}
                  >
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts.length === 0 && expenses.length > 0 && (
        <div
          className="text-center py-6 rounded-xl"
          style={{ background: "var(--panel)" }}
        >
          <p className="text-2xl mb-1">✅</p>
          <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            All settled up!
          </p>
        </div>
      )}

      {/* Settlement history */}
      {settlements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
            Settlement History
          </h3>
          <div className="space-y-1.5">
            {[...settlements].reverse().map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <span style={{ color: "var(--muted)" }}>
                  {getMemberName(s.fromId)} paid {getMemberName(s.toId)}
                </span>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {formatMoney(s.amountCents, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
