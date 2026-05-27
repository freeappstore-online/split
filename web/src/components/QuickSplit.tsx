import { useState, useMemo } from "react";
import type { Currency } from "../lib/types";
import { CURRENCY_SYMBOLS } from "../lib/types";
import { formatMoney, parseToCents } from "../lib/format";

const TIP_PRESETS = [10, 15, 18, 20] as const;

interface QuickSplitProps {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
}

export default function QuickSplit({ currency, onCurrencyChange }: QuickSplitProps) {
  const [totalInput, setTotalInput] = useState("");
  const [numPeople, setNumPeople] = useState(2);
  const [tipPercent, setTipPercent] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);

  const effectiveTip = useCustomTip ? (parseFloat(customTip) || 0) : tipPercent;

  const result = useMemo(() => {
    const totalCents = parseToCents(totalInput);
    if (totalCents <= 0 || numPeople <= 0) return null;

    const tipCents = Math.round(totalCents * effectiveTip / 100);
    const grandTotalCents = totalCents + tipCents;
    const perPersonBase = Math.floor(grandTotalCents / numPeople);
    const remainder = grandTotalCents - perPersonBase * numPeople;

    return {
      subtotalCents: totalCents,
      tipCents,
      grandTotalCents,
      perPersonBase,
      remainder,
    };
  }, [totalInput, numPeople, effectiveTip]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Quick Split
        </h2>
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
              {c} ({CURRENCY_SYMBOLS[c]})
            </option>
          ))}
        </select>
      </div>

      {/* Total */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
          Bill Total
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: "var(--muted)" }}
          >
            {CURRENCY_SYMBOLS[currency]}
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            className="w-full rounded-xl pl-8 pr-4 py-3 text-lg font-semibold"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Number of people */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
          Number of People
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold cursor-pointer"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            -
          </button>
          <span className="text-2xl font-bold w-12 text-center" style={{ color: "var(--ink)" }}>
            {numPeople}
          </span>
          <button
            onClick={() => setNumPeople(numPeople + 1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold cursor-pointer"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Tip */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
          Tip
        </label>
        <div className="flex flex-wrap gap-2">
          {TIP_PRESETS.map((pct) => (
            <button
              key={pct}
              onClick={() => {
                setUseCustomTip(false);
                setTipPercent(tipPercent === pct && !useCustomTip ? 0 : pct);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
              style={{
                background:
                  !useCustomTip && tipPercent === pct
                    ? "var(--accent)"
                    : "var(--panel)",
                color:
                  !useCustomTip && tipPercent === pct ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              {pct}%
            </button>
          ))}
          <button
            onClick={() => {
              setUseCustomTip(true);
              setTipPercent(0);
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
            style={{
              background: useCustomTip ? "var(--accent)" : "var(--panel)",
              color: useCustomTip ? "#fff" : "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            Custom
          </button>
        </div>
        {useCustomTip && (
          <div className="mt-2 relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter tip %"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              className="w-32 rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--muted)" }}
            >
              %
            </span>
          </div>
        )}
      </div>

      {/* Result */}
      {result && result.grandTotalCents > 0 && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          {result.tipCents > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>
                Tip ({effectiveTip}%)
              </span>
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                {formatMoney(result.tipCents, currency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>Grand Total</span>
            <span className="font-medium" style={{ color: "var(--ink)" }}>
              {formatMoney(result.grandTotalCents, currency)}
            </span>
          </div>
          <div
            className="border-t pt-3"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                Per Person
              </span>
              <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                {formatMoney(result.perPersonBase + (result.remainder > 0 ? 1 : 0), currency)}
              </span>
            </div>
            {result.remainder > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {result.remainder} {result.remainder === 1 ? "person pays" : "people pay"}{" "}
                {formatMoney(result.perPersonBase + 1, currency)}, the rest pay{" "}
                {formatMoney(result.perPersonBase, currency)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
