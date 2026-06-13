import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";

// Replace with real menu items and handlers.
const MENU_ITEMS = ["Settings", "Privacy", "Help & Support", "Sign Out"];

export default function ProfilePage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Profile" />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 28 }}>
          U
        </Avatar>
        <Box>
          <Typography variant="h6">Username</Typography>
          <Typography variant="body2" color="text.secondary">
            user@example.com
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <List disablePadding>
        {MENU_ITEMS.map((item) => (
          <ListItem key={item} divider>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
