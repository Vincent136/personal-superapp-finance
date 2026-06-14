import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function SideNav({ width = 240, items, title }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        width,
        flexShrink: 0,
        height: "100%",
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        pt: 3,
        px: 1,
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ px: 2, mb: 3 }}>
        {title}
      </Typography>

      <List disablePadding>
        {items.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => navigate(path)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon color={active ? "primary" : "inherit"} />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
