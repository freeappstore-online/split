import type { Debt, Expense, Settlement } from "./types";
import { calculateSplit } from "./splitting";

/**
 * Calculate net balances for each member across all expenses and settlements.
 * Positive = owed money (others owe you), Negative = owes money (you owe others).
 */
export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[],
  memberIds: string[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const id of memberIds) {
    balances[id] = 0;
  }

  // Process expenses
  for (const expense of expenses) {
    const splits = calculateSplit(expense);

    // Payer gets credited the full amount
    balances[expense.paidById] = (balances[expense.paidById] ?? 0) + expense.amountCents;

    // Each person's share is debited
    for (const [memberId, share] of Object.entries(splits)) {
      balances[memberId] = (balances[memberId] ?? 0) - share;
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    // The person who paid (from) gets credited
    balances[settlement.fromId] = (balances[settlement.fromId] ?? 0) + settlement.amountCents;
    // The person who received gets debited
    balances[settlement.toId] = (balances[settlement.toId] ?? 0) - settlement.amountCents;
  }

  return balances;
}

/**
 * Simplify debts: minimize the number of transactions needed to settle up.
 *
 * Algorithm: repeatedly match the person who owes the most with the person
 * who is owed the most. Create a transaction for the minimum of the two
 * absolute amounts. Repeat until all balances are zero.
 */
export function simplifyDebts(balances: Record<string, number>): Debt[] {
  // Create mutable copy of balances, filtering out zero/near-zero
  const remaining = new Map<string, number>();
  for (const [id, balance] of Object.entries(balances)) {
    if (Math.abs(balance) >= 1) {
      remaining.set(id, balance);
    }
  }

  const debts: Debt[] = [];

  while (remaining.size > 0) {
    // Find max creditor (most positive) and max debtor (most negative)
    let maxCreditorId = "";
    let maxCreditorAmount = 0;
    let maxDebtorId = "";
    let maxDebtorAmount = 0;

    for (const [id, balance] of remaining) {
      if (balance > maxCreditorAmount) {
        maxCreditorId = id;
        maxCreditorAmount = balance;
      }
      if (balance < maxDebtorAmount) {
        maxDebtorId = id;
        maxDebtorAmount = balance;
      }
    }

    if (!maxCreditorId || !maxDebtorId) break;

    const amount = Math.min(maxCreditorAmount, -maxDebtorAmount);
    if (amount < 1) break;

    debts.push({
      fromId: maxDebtorId,
      toId: maxCreditorId,
      amountCents: amount,
    });

    // Update balances
    const newCreditorBalance = maxCreditorAmount - amount;
    const newDebtorBalance = maxDebtorAmount + amount;

    if (Math.abs(newCreditorBalance) < 1) {
      remaining.delete(maxCreditorId);
    } else {
      remaining.set(maxCreditorId, newCreditorBalance);
    }

    if (Math.abs(newDebtorBalance) < 1) {
      remaining.delete(maxDebtorId);
    } else {
      remaining.set(maxDebtorId, newDebtorBalance);
    }
  }

  return debts;
}
