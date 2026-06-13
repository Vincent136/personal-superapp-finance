import { Box, Card, CardContent, Typography } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";

// Replace these with real data / API calls.
const EXAMPLE_CARDS = [
  { title: "Feature A", description: "Describe this feature. Replace with your content." },
  { title: "Feature B", description: "Describe this feature. Replace with your content." },
  { title: "Feature C", description: "Describe this feature. Replace with your content." },
];

export default function HomePage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Home" subtitle="Welcome to your app" />

      {/* Responsive CSS grid: 1 col → 2 col → 3 col */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {EXAMPLE_CARDS.map(({ title, description }) => (
          <Card key={title}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
