import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

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
];
