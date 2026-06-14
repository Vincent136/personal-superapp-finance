import AppsIcon from "@mui/icons-material/Apps";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";

// Add, remove, or reorder items here to update both BottomNav (mobile) and SideNav (desktop).
export const FINANCE_NAV_ITEMS = [
  { label: "Apps",         path: "/",                     icon: AppsIcon                 },
  { label: "Home",         path: "/finance",              icon: HomeIcon                 },
  { label: "Transactions", path: "/finance/transactions", icon: ReceiptLongIcon          },
  { label: "Budget",       path: "/finance/budget",       icon: AccountBalanceWalletIcon },
  { label: "Settings",     path: "/finance/settings",     icon: SettingsIcon             },
];
