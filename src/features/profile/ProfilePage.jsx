import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";

// Replace with real menu items and handlers.
const MENU_ITEMS = ["Settings", "Privacy", "Help & Support"];

export default function ProfilePage() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const email = user?.email ?? "";
  const initial = email ? email[0].toUpperCase() : "U";

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Profile"
        action={<Button onClick={() => navigate("/")}>Back to Apps</Button>}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 28 }}>
          {initial}
        </Avatar>
        <Box>
          <Typography variant="h6">{email || "Signed in"}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <List disablePadding>
        {MENU_ITEMS.map((item) => (
          <ListItem key={item} divider disablePadding>
            <ListItemButton>
              <ListItemText primary={item} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAdmin && (
          <ListItem divider disablePadding>
            <ListItemButton onClick={() => navigate("/admin")}>
              <ListItemText primary="Admin Dashboard" />
            </ListItemButton>
          </ListItem>
        )}
        <ListItem divider disablePadding>
          <ListItemButton onClick={signOut}>
            <ListItemText primary="Sign Out" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
