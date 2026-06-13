import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/common/PageHeader";

export default function SearchPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Search" />

      <TextField
        fullWidth
        placeholder="Search…"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      <Typography variant="body2" color="text.secondary">
        Results will appear here.
      </Typography>
    </Box>
  );
}
