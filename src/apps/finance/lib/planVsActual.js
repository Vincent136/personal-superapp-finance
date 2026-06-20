// Builds per-category plan-vs-actual rows for a single pay period.
//
// `categories` — from useCategories()
// `budgetItems` — budget_items rows for the period (category_id, amount, currency)
// `transactions` — transaction rows within the period's date range
//   (category_id, type, amount, currency)
// `toIDR` — optional conversion function (amount, currencyCode) → IDR amount.
//   Defaults to identity so callers that don't pass it keep working.
export function buildPlanVsActualRows(categories, budgetItems, transactions, toIDR = (a) => a) {
  const plannedByCategory = new Map(
    budgetItems.map((item) => [
      item.category_id,
      toIDR(Number(item.amount), item.currency ?? "IDR"),
    ]),
  );
  const actualByCategory = new Map();
  for (const transaction of transactions) {
    actualByCategory.set(
      transaction.category_id,
      (actualByCategory.get(transaction.category_id) ?? 0) +
        toIDR(Number(transaction.amount), transaction.currency ?? "IDR"),
    );
  }

  const rows = categories
    .map((category) => ({
      ...category,
      planned: plannedByCategory.get(category.id) ?? 0,
      actual: actualByCategory.get(category.id) ?? 0,
    }))
    .filter((row) => row.planned > 0 || row.actual > 0)
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
    );

  const totalPlannedIncome = rows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.planned, 0);
  const totalActualIncome = rows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.actual, 0);
  const totalPlannedExpense = rows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + row.planned, 0);
  const totalActualExpense = rows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + row.actual, 0);

  return {
    rows,
    totalPlannedIncome,
    totalActualIncome,
    totalPlannedExpense,
    totalActualExpense,
  };
}
