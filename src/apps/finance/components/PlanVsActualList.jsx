import { Box, Divider, LinearProgress, Stack, Typography } from "@mui/material";

// Renders per-category plan-vs-actual rows plus income/expense totals, given
// the shape returned by `buildPlanVsActualRows`.
export default function PlanVsActualList({
  rows,
  totalPlannedIncome,
  totalActualIncome,
  totalPlannedExpense,
  totalActualExpense,
  format,
  emptyMessage = "No budget or transactions for this period yet.",
}) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {rows.map((row) => {
        const remaining = row.planned - row.actual;
        const isOver = remaining < 0;
        const overIsBad = row.type === "expense";
        const progress =
          row.planned > 0 ? Math.min((row.actual / row.planned) * 100, 100) : row.actual > 0 ? 100 : 0;
        const remainingColor = isOver
          ? overIsBad
            ? "error.main"
            : "success.main"
          : "text.secondary";
        const remainingLabel = isOver
          ? `${row.type === "income" ? "Exceeded by" : "Over by"} ${format(Math.abs(remaining))}`
          : `Remaining ${format(remaining)}`;

        return (
          <Box key={row.id}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {row.name}
              </Typography>
              <Typography variant="body2" color={remainingColor}>
                {remainingLabel}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={isOver && overIsBad ? "error" : "primary"}
              sx={{ mb: 0.5 }}
            />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Actual {format(row.actual)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Planned {format(row.planned)}
              </Typography>
            </Stack>
          </Box>
        );
      })}

      <Divider />

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle2">Income — actual / planned</Typography>
        <Typography variant="subtitle2">
          {format(totalActualIncome)} / {format(totalPlannedIncome)}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle2">Expense — actual / planned</Typography>
        <Typography variant="subtitle2">
          {format(totalActualExpense)} / {format(totalPlannedExpense)}
        </Typography>
      </Stack>
    </Stack>
  );
}
