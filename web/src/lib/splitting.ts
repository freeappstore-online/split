import type { Expense, SplitType } from "./types";

/**
 * Calculate how much each person owes for an expense, in cents.
 * Returns a map of memberId -> cents owed.
 *
 * When splitting equally, remainder cents are distributed one-per-person
 * to the first N people in the splitBetween array.
 */
export function calculateSplit(expense: Expense): Record<string, number> {
  const { amountCents, splitBetween, splitType, splitValues } = expense;
  const result: Record<string, number> = {};

  if (splitBetween.length === 0) return result;

  switch (splitType) {
    case "equal": {
      const base = Math.floor(amountCents / splitBetween.length);
      const remainder = amountCents - base * splitBetween.length;
      for (let i = 0; i < splitBetween.length; i++) {
        const memberId = splitBetween[i]!;
        result[memberId] = base + (i < remainder ? 1 : 0);
      }
      break;
    }
    case "exact": {
      for (const memberId of splitBetween) {
        result[memberId] = splitValues[memberId] ?? 0;
      }
      break;
    }
    case "percentage": {
      let assigned = 0;
      for (let i = 0; i < splitBetween.length; i++) {
        const memberId = splitBetween[i]!;
        const pct = splitValues[memberId] ?? 0;
        if (i === splitBetween.length - 1) {
          // Last person gets the remainder to avoid rounding issues
          result[memberId] = amountCents - assigned;
        } else {
          const share = Math.round((amountCents * pct) / 100);
          result[memberId] = share;
          assigned += share;
        }
      }
      break;
    }
    case "shares": {
      const totalShares = splitBetween.reduce(
        (sum, id) => sum + (splitValues[id] ?? 1),
        0,
      );
      if (totalShares === 0) break;
      let assigned = 0;
      for (let i = 0; i < splitBetween.length; i++) {
        const memberId = splitBetween[i]!;
        const memberShares = splitValues[memberId] ?? 1;
        if (i === splitBetween.length - 1) {
          result[memberId] = amountCents - assigned;
        } else {
          const share = Math.round((amountCents * memberShares) / totalShares);
          result[memberId] = share;
          assigned += share;
        }
      }
      break;
    }
  }

  return result;
}

/**
 * Validate that split values match the total.
 * Returns an error message or null if valid.
 */
export function validateSplit(
  splitType: SplitType,
  amountCents: number,
  splitBetween: string[],
  splitValues: Record<string, number>,
): string | null {
  if (splitBetween.length === 0) {
    return "Select at least one person to split between";
  }

  switch (splitType) {
    case "equal":
      return null;
    case "exact": {
      const total = splitBetween.reduce(
        (sum, id) => sum + (splitValues[id] ?? 0),
        0,
      );
      if (total !== amountCents) {
        return `Exact amounts must sum to the total (${formatCentsForValidation(total)} / ${formatCentsForValidation(amountCents)})`;
      }
      return null;
    }
    case "percentage": {
      const total = splitBetween.reduce(
        (sum, id) => sum + (splitValues[id] ?? 0),
        0,
      );
      if (Math.abs(total - 100) > 0.01) {
        return `Percentages must sum to 100% (currently ${total}%)`;
      }
      return null;
    }
    case "shares": {
      const total = splitBetween.reduce(
        (sum, id) => sum + (splitValues[id] ?? 0),
        0,
      );
      if (total === 0) {
        return "Total shares must be greater than 0";
      }
      return null;
    }
  }
}

function formatCentsForValidation(cents: number): string {
  return (cents / 100).toFixed(2);
}
