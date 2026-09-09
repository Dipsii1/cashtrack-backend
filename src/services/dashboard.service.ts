import { prisma } from "../prisma/client.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import { walletRepository } from "../repositories/wallet.repository.js";
import { budgetRepository } from "../repositories/budget.repository.js";
import { savingsGoalRepository } from "../repositories/savings-goal.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
const TRANSACTION_LIMIT = 10000;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatMonth(d: Date): string {
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return names[d.getMonth()];
}

function subMonths(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() - n);
  return copy;
}

export const dashboardService = {
  async getDashboard(userId: bigint) {
    const now = new Date();
    const start6Months = subMonths(now, 5);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      { data: transactions },
      { data: wallets },
      { data: goals },
      { data: budgets },
      { data: categories },
    ] = await Promise.all([
      transactionRepository.findByUserId(userId, {
        startDate: start6Months,
        endDate: now,
        page: 1,
        limit: TRANSACTION_LIMIT,
      }),
      walletRepository.findByUserId(userId, { page: 1, limit: TRANSACTION_LIMIT }),
      savingsGoalRepository.findByUserId(userId, { page: 1, limit: TRANSACTION_LIMIT }),
      budgetRepository.findByUserId(userId, { page: 1, limit: TRANSACTION_LIMIT }),
      categoryRepository.findByUserId(userId, { type: undefined, page: 1, limit: TRANSACTION_LIMIT }),
    ]);

    const txWithCategory = transactions as any[];

    const thisMonthTx = txWithCategory.filter((t) => {
      const d = new Date(t.transactionDate);
      return d >= monthStart && d <= monthEnd;
    });

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const income = thisMonthTx.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = thisMonthTx.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0);
    const savings = goals.filter((g) => !g.isAchieved).reduce((sum, g) => sum + Number(g.currentAmount), 0);

    const budgetTotal = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const spentThisMonth = expense;
    const budgetRemaining = Math.max(budgetTotal - spentThisMonth, 0);

    const incomeExpenseByDay = (() => {
      const map = new Map<string, { date: string; income: number; expense: number }>();
      const daysInMonth = monthEnd.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        map.set(formatDate(date), { date: formatDate(date), income: 0, expense: 0 });
      }
      for (const t of thisMonthTx) {
        const key = formatDate(new Date(t.transactionDate));
        const entry = map.get(key);
        if (!entry) continue;
        if (t.type === "INCOME") entry.income += Number(t.amount);
        if (t.type === "EXPENSE") entry.expense += Number(t.amount);
      }
      return Array.from(map.values());
    })();

    const categoryExpense = (() => {
      const map = new Map<string, { name: string; value: number; color: string }>();
      for (const t of thisMonthTx) {
        if (t.type !== "EXPENSE" || !t.category) continue;
        const existing = map.get(t.category.publicId) ?? { name: t.category.name, value: 0, color: t.category.color ?? "#0a0a0a" };
        existing.value += Number(t.amount);
        map.set(t.category.publicId, existing);
      }
      return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 8);
    })();

    const monthlySpending = (() => {
      const result: { month: string; income: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const monthTx = txWithCategory.filter((t) => {
          const d = new Date(t.transactionDate);
          return d >= start && d <= end;
        });
        result.push({
          month: formatMonth(date),
          income: monthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0),
          expense: monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0),
        });
      }
      return result;
    })();

    const recentTransactions = [...txWithCategory]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 6);

    const categoryMap = Object.fromEntries(categories.map((c) => [c.publicId, c]));

    return {
      totalBalance,
      income,
      expense,
      savings,
      budgetRemaining,
      budgetTotal,
      spentThisMonth,
      incomeExpenseByDay,
      categoryExpense,
      monthlySpending,
      recentTransactions,
      wallets,
      budgets,
      goals,
      categories,
      categoryMap,
    };
  },
};
