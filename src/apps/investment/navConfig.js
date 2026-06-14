import AppsIcon from "@mui/icons-material/Apps";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";

// Add, remove, or reorder items here to update both BottomNav (mobile) and SideNav (desktop).
export const INVESTMENT_NAV_ITEMS = [
  { label: "Apps",      path: "/",                  icon: AppsIcon       },
  { label: "Dashboard", path: "/investment",        icon: DashboardIcon },
  { label: "Reports",   path: "/investment/reports", icon: DescriptionIcon },
];
