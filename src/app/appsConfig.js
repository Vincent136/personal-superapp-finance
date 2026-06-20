import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LuggageIcon from "@mui/icons-material/Luggage";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

// Registry of installed apps shown on the app launcher.
// To add a new app: create src/apps/<id>/ (with its own routes + navConfig)
// and add an entry here.
export const APPS = [
  {
    id: "finance",
    label: "Finance",
    description: "Track transactions, budgets, and balances.",
    path: "/finance",
    icon: AccountBalanceWalletIcon,
  },
  {
    id: "investment",
    label: "Investment",
    description: "Track multi-currency capital and investment plan sheets.",
    path: "/investment",
    icon: ShowChartIcon,
  },
  {
    id: "health",
    label: "Health",
    description: "Track cardio, sleep, body metrics, and daily journal.",
    path: "/health",
    icon: FavoriteIcon,
  },
  {
    id: "trip",
    label: "Trips",
    description: "Plan trips, map places, track costs, and log memories.",
    path: "/trip",
    icon: LuggageIcon,
  },
  {
    id: "wallet",
    label: "Wallet",
    description: "Multi-currency wallets, exchange rates, and cross-app budget overview.",
    path: "/wallet",
    icon: AccountBalanceIcon,
  },
];
