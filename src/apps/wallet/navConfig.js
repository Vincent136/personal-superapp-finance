import AppsIcon            from "@mui/icons-material/Apps";
import DashboardIcon        from "@mui/icons-material/Dashboard";
import AccountBalanceIcon   from "@mui/icons-material/AccountBalance";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";

export const WALLET_NAV_ITEMS = [
  { label: "Apps",     path: "/",               icon: AppsIcon            },
  { label: "Overview", path: "/wallet",          icon: DashboardIcon       },
  { label: "Wallets",  path: "/wallet/wallets",  icon: AccountBalanceIcon  },
  { label: "Rates",    path: "/wallet/rates",    icon: CurrencyExchangeIcon },
];
