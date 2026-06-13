import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../../app/navConfig";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

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
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, value) => navigate(value)}
        showLabels
      >
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <BottomNavigationAction
            key={path}
            label={label}
            value={path}
            icon={<Icon />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
