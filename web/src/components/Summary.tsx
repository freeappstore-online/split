import { useMemo, useRef, useEffect } from "react";
import type { Expense, Member, Category, Currency } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { formatMoney } from "../lib/format";

interface SummaryProps {
  expenses: Expense[];
  members: Member[];
  currency: Currency;
}

const CHART_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5",
];

export default function Summary({ expenses, members, currency }: SummaryProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Add expenses to see summary charts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SpendingByCategory expenses={expenses} currency={currency} />
      <SpendingByPerson expenses={expenses} members={members} currency={currency} />
      <SpendingOverTime expenses={expenses} currency={currency} />
      <TopStats expenses={expenses} members={members} currency={currency} />
    </div>
  );
}

/* ── Donut chart: Spending by Category ────────────────────────── */

function SpendingByCategory({ expenses, currency }: { expenses: Expense[]; currency: Currency }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const data = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const e of expenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountCents);
    }
    return CATEGORIES
      .map((cat, i) => ({
        label: cat.label,
        icon: cat.icon,
        value: totals.get(cat.id) ?? 0,
        color: CHART_COLORS[i % CHART_COLORS.length]!,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = data.reduce((s, d) => s + d.value, 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 180;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = 80;
    const innerR = 50;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;
    for (const d of data) {
      const sweep = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
      ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      startAngle += sweep;
    }

    // Center text
    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--ink").trim() || "#1a1a1a";
    const muted = style.getPropertyValue("--muted").trim() || "#6b7280";
    ctx.fillStyle = ink;
    ctx.font = "bold 16px Manrope, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formatMoney(total, currency), cx, cy - 6);
    ctx.fillStyle = muted;
    ctx.font = "11px Manrope, system-ui, sans-serif";
    ctx.fillText("total", cx, cy + 12);
  }, [data, total, currency]);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
        Spending by Category
      </h3>
      <div className="flex items-center gap-6">
        <canvas ref={canvasRef} />
        <div className="space-y-1.5 flex-1">
          {data.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ background: d.color }}
                />
                <span style={{ color: "var(--ink)" }}>
                  {d.icon} {d.label}
                </span>
              </div>
              <span className="font-medium" style={{ color: "var(--muted)" }}>
                {formatMoney(d.value, currency)} ({Math.round((d.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Bar chart: Spending by Person ───────────────────────────── */

function SpendingByPerson({
  expenses,
  members,
  currency,
}: {
  expenses: Expense[];
  members: Member[];
  currency: Currency;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      totals.set(e.paidById, (totals.get(e.paidById) ?? 0) + e.amountCents);
    }
    return members.map((m, i) => ({
      name: m.name,
      value: totals.get(m.id) ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length]!,
    }));
  }, [expenses, members]);

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement?.clientWidth ?? 300;
    const barH = 28;
    const gap = 8;
    const h = data.length * (barH + gap) + 10;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--ink").trim() || "#1a1a1a";
    const line = style.getPropertyValue("--line").trim() || "#e5e7eb";

    ctx.clearRect(0, 0, w, h);

    const labelW = 80;
    const chartW = w - labelW - 80;

    data.forEach((d, i) => {
      const y = i * (barH + gap) + 5;

      // Label
      ctx.fillStyle = ink;
      ctx.font = "12px Manrope, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(d.name.length > 10 ? d.name.slice(0, 10) + "..." : d.name, labelW - 8, y + barH / 2);

      // Background bar
      ctx.fillStyle = line;
      ctx.beginPath();
      ctx.roundRect(labelW, y, chartW, barH, 6);
      ctx.fill();

      // Value bar
      const barW = maxVal > 0 ? (d.value / maxVal) * chartW : 0;
      if (barW > 0) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.roundRect(labelW, y, Math.max(barW, 6), barH, 6);
        ctx.fill();
      }

      // Value text
      ctx.fillStyle = ink;
      ctx.font = "bold 11px Manrope, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formatMoney(d.value, currency), labelW + chartW + 8, y + barH / 2);
    });
  }, [data, maxVal, currency]);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
        Spending by Person (who paid)
      </h3>
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}

/* ── Line chart: Spending Over Time ──────────────────────────── */

function SpendingOverTime({ expenses, currency }: { expenses: Expense[]; currency: Currency }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const data = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const e of expenses) {
      byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amountCents);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }, [expenses]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement?.clientWidth ?? 300;
    const h = 160;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--ink").trim() || "#1a1a1a";
    const line = style.getPropertyValue("--line").trim() || "#e5e7eb";
    const accent = style.getPropertyValue("--accent").trim() || "#2563eb";

    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) {
      ctx.fillStyle = ink;
      ctx.font = "12px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Need at least 2 dates for a chart", w / 2, h / 2);
      return;
    }

    const padL = 60;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const maxVal = Math.max(...data.map((d) => d.value));
    const minVal = 0;
    const range = maxVal - minVal || 1;

    const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
    const toY = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      const val = maxVal - (range / 4) * i;
      ctx.fillStyle = ink;
      ctx.font = "10px Manrope, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(formatMoney(Math.round(val), currency), padL - 6, y);
    }

    // Date labels
    ctx.fillStyle = ink;
    ctx.font = "10px Manrope, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelStep = Math.max(1, Math.floor(data.length / 5));
    data.forEach((d, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const shortDate = d.date.slice(5); // MM-DD
        ctx.fillText(shortDate, toX(i), h - padB + 6);
      }
    });

    // Line
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = toX(i);
      const y = toY(d.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      const x = toX(i);
      const y = toY(d.value);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    });
  }, [data, currency]);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
        Spending Over Time
      </h3>
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}

/* ── Top Stats ───────────────────────────────────────────────── */

function TopStats({
  expenses,
  members,
  currency,
}: {
  expenses: Expense[];
  members: Member[];
  currency: Currency;
}) {
  const stats = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      totals.set(e.paidById, (totals.get(e.paidById) ?? 0) + e.amountCents);
    }

    let mostId = "";
    let mostVal = 0;
    let leastId = "";
    let leastVal = Infinity;

    for (const [id, val] of totals) {
      if (val > mostVal) {
        mostId = id;
        mostVal = val;
      }
      if (val < leastVal) {
        leastId = id;
        leastVal = val;
      }
    }

    // Include members who paid nothing
    for (const m of members) {
      if (!totals.has(m.id) && 0 < leastVal) {
        leastId = m.id;
        leastVal = 0;
      }
    }

    const getName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

    return {
      totalExpenses: expenses.reduce((s, e) => s + e.amountCents, 0),
      avgPerExpense: Math.round(
        expenses.reduce((s, e) => s + e.amountCents, 0) / expenses.length,
      ),
      mostPayer: mostId ? `${getName(mostId)} (${formatMoney(mostVal, currency)})` : "-",
      leastPayer: leastId ? `${getName(leastId)} (${formatMoney(leastVal, currency)})` : "-",
    };
  }, [expenses, members, currency]);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Total Spent", value: formatMoney(stats.totalExpenses, currency) },
          { label: "Avg per Expense", value: formatMoney(stats.avgPerExpense, currency) },
          { label: "Paid Most", value: stats.mostPayer },
          { label: "Paid Least", value: stats.leastPayer },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-3"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {stat.label}
            </p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
