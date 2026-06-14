import { useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APPS } from "../../app/appsConfig";

export default function AppLauncherPage() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const email = user?.email ?? "";
  const initial = email ? email[0].toUpperCase() : "U";

  const closeMenu = () => setAnchorEl(null);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          My Apps
        </Typography>

        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>{initial}</Avatar>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              closeMenu();
              navigate("/profile");
            }}
          >
            Profile
          </MenuItem>
          {isAdmin && (
            <MenuItem
              onClick={() => {
                closeMenu();
                navigate("/admin");
              }}
            >
              Admin Dashboard
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              closeMenu();
              signOut();
            }}
          >
            Sign Out
          </MenuItem>
        </Menu>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {APPS.map(({ id, label, description, path, icon: Icon }) => (
          <Card key={id}>
            <CardActionArea onClick={() => navigate(path)} sx={{ height: "100%" }}>
              <CardContent
                sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}
              >
                <Icon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">{label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
