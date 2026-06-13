import { createTheme } from "@mui/material/styles";

// ─── Brand colours ───────────────────────────────────────────────────────────
// Change primary / secondary here and the whole app updates automatically.
const BRAND = {
  primary:   "#1976d2",
  secondary: "#f50057",
};

const theme = createTheme({
  palette: {
    primary:    { main: BRAND.primary },
    secondary:  { main: BRAND.secondary },
    background: { default: "#f5f5f5", paper: "#ffffff" },
    mode: "light",
  },

  typography: {
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },

  shape: { borderRadius: 12 },

  // ─── Component defaults ──────────────────────────────────────────────────
  // Centralise visual tweaks here instead of repeating sx props everywhere.
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { height: 56 } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main + "14", // 8 % tint
            "&:hover": { backgroundColor: theme.palette.primary.main + "1F" },
          },
        }),
      },
    },
  },
});

export default theme;
