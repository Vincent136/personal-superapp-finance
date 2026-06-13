import { useMediaQuery, useTheme } from "@mui/material";

/**
 * Returns the current responsive tier based on the MUI theme breakpoints.
 *
 * Usage:
 *   const { isMobile, isTablet, isDesktop } = useBreakpoint();
 */
export function useBreakpoint() {
  const theme = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet  = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  return { isMobile, isTablet, isDesktop };
}
