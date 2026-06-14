// Profit % = (actual_out - actual_in) / actual_in * 100, only once both
// actuals are filled in (a position is considered "closed" at that point).
export function computeProfitPercent(instrument) {
  const actualIn = Number(instrument.actual_in);
  const actualOut = Number(instrument.actual_out);

  if (!instrument.actual_in || !instrument.actual_out || actualIn === 0) {
    return null;
  }

  return ((actualOut - actualIn) / actualIn) * 100;
}

// For each instrument, profit (money) = amount_invested * profitPercent / 100
// (0 if the position isn't closed yet). finalResult = totalCapital + totalProfit.
export function computeSheetTotals(instruments) {
  const totals = instruments.reduce(
    (acc, instrument) => {
      const amount = Number(instrument.amount_invested) || 0;
      const profitPercent = computeProfitPercent(instrument);
      const profit = profitPercent != null ? amount * (profitPercent / 100) : 0;

      return {
        totalCapital: acc.totalCapital + amount,
        totalProfit: acc.totalProfit + profit,
      };
    },
    { totalCapital: 0, totalProfit: 0 },
  );

  return { ...totals, finalResult: totals.totalCapital + totals.totalProfit };
}
