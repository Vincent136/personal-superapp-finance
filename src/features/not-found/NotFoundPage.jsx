import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        p: 3,
        textAlign: "center",
      }}
    >
      <Typography
        variant="h1"
        fontWeight={700}
        color="text.disabled"
        sx={{ fontSize: { xs: 80, md: 120 }, lineHeight: 1 }}
      >
        404
      </Typography>
      <Typography variant="h5" fontWeight={600} mt={2} gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Go Home
      </Button>
    </Box>
  );
}
