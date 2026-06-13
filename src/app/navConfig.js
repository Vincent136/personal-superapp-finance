import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";

// Add, remove, or reorder items here to update both BottomNav (mobile) and SideNav (desktop).
export const NAV_ITEMS = [
  { label: "Home",         path: "/",             icon: HomeIcon               },
  { label: "Transactions", path: "/transactions", icon: ReceiptLongIcon        },
  { label: "Budget",       path: "/budget",       icon: AccountBalanceWalletIcon },
  { label: "Profile",      path: "/profile",      icon: PersonIcon             },
];
