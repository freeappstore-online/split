import type { Currency } from "./types";
import { CURRENCY_SYMBOLS } from "./types";

/**
 * Format cents as a currency string.
 * e.g. 1234 -> "$12.34"
 */
export function formatMoney(cents: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const sign = cents < 0 ? "-" : "";
  return `${sign}${symbol}${dollars}.${String(remainder).padStart(2, "0")}`;
}

/**
 * Parse a dollar string to cents.
 * e.g. "12.34" -> 1234, "12" -> 1200
 */
export function parseToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const parts = cleaned.split(".");
  const dollars = parseInt(parts[0] ?? "0", 10) || 0;
  const centsStr = (parts[1] ?? "").padEnd(2, "0").slice(0, 2);
  const cents = parseInt(centsStr, 10) || 0;
  return dollars * 100 + cents;
}

/**
 * Format cents as a dollar string for input fields.
 * e.g. 1234 -> "12.34"
 */
export function centsToInputValue(cents: number): string {
  const dollars = Math.floor(Math.abs(cents) / 100);
  const remainder = Math.abs(cents) % 100;
  return `${dollars}.${String(remainder).padStart(2, "0")}`;
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
