import AppsIcon from "@mui/icons-material/Apps";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import ScaleIcon from "@mui/icons-material/Scale";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export const HEALTH_NAV_ITEMS = [
  { label: "Apps",    path: "/",               icon: AppsIcon           },
  { label: "Cardio",  path: "/health/cardio",  icon: DirectionsWalkIcon },
  { label: "Sleep",   path: "/health/sleep",   icon: BedtimeIcon        },
  { label: "Body",    path: "/health/body",    icon: ScaleIcon          },
  { label: "Journal", path: "/health/journal", icon: MenuBookIcon       },
];
