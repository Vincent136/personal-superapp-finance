import { Box, Typography } from "@mui/material";

/**
 * PageHeader — consistent title block used at the top of every page.
 *
 * Props:
 *   title    {string}      Required. Main heading text.
 *   subtitle {string}      Optional. Secondary line below the title.
 *   action   {ReactNode}   Optional. Element rendered flush-right (e.g. a Button).
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}
