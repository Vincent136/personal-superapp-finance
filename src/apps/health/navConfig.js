import AppsIcon from "@mui/icons-material/Apps";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import ScaleIcon from "@mui/icons-material/Scale";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import WcIcon from "@mui/icons-material/Wc";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

export const HEALTH_NAV_ITEMS = [
  { label: "Apps",    path: "/",               icon: AppsIcon           },
  { label: "Cardio",  path: "/health/cardio",  icon: DirectionsWalkIcon },
  { label: "Sleep",   path: "/health/sleep",   icon: BedtimeIcon        },
  { label: "Meals",   path: "/health/meals",   icon: RestaurantIcon     },
  { label: "Drinks",  path: "/health/drinks",  icon: WaterDropIcon      },
  { label: "Body",    path: "/health/body",    icon: ScaleIcon          },
  { label: "Poop",    path: "/health/poop",    icon: WcIcon             },
  { label: "Journal", path: "/health/journal", icon: MenuBookIcon       },
];
