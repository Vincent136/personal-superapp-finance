import { Box, useMediaQuery, useTheme } from "@mui/material";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";

// Keep in sync with the SideNav width and BottomNavigation height (MUI default: 56px).
const SIDE_NAV_WIDTH = 240;
const BOTTOM_NAV_HEIGHT = 56;

/**
 * AppShell — top-level layout wrapper.
 *
 * Mobile  (< md): full-width content + fixed BottomNav
 * Desktop (≥ md): fixed SideNav on the left + scrollable content area
 */
export default function AppShell({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      {isDesktop && <SideNav width={SIDE_NAV_WIDTH} />}

      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: "auto",
          // Push content above the fixed bottom bar on mobile.
          pb: isDesktop
            ? 0
            : `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        {children}
      </Box>

      {!isDesktop && <BottomNav />}
    </Box>
  );
}
