import AppsIcon from "@mui/icons-material/Apps";
import LuggageIcon from "@mui/icons-material/Luggage";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export const TRIP_NAV_ITEMS = [
  { label: "Apps",   path: "/",            icon: AppsIcon                },
  { label: "Trips",  path: "/trip",        icon: LuggageIcon             },
  { label: "Budget", path: "/trip/budget", icon: AccountBalanceWalletIcon },
];
