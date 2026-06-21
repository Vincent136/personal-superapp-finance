import { Box, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav({ items }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Each action is ~68px wide; when more than 5 items exist we let the bar scroll
  // horizontally so users can reach every destination without truncation.
  const scrollable = items.length > 5;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        pb: "env(safe-area-inset-bottom)",
        zIndex: "appBar",
        overflowX: scrollable ? "auto" : "hidden",
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, value) => navigate(value)}
        showLabels
        sx={{
          // Stretch to fit all items when scrollable; otherwise fill the viewport.
          minWidth: scrollable ? items.length * 68 : "100%",
          width: scrollable ? items.length * 68 : "100%",
        }}
      >
        {items.map(({ label, path, icon: Icon }) => (
          <BottomNavigationAction
            key={path}
            label={label}
            value={path}
            icon={<Icon />}
            sx={{ minWidth: 0, maxWidth: 72, px: 0.5 }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
