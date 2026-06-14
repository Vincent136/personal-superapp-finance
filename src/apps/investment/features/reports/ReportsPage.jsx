import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PageHeader from "../../../../components/common/PageHeader";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";

const BUCKET = "investment-reports";

async function fetchReports() {
  const { data, error } = await supabase
    .from("investment_reports")
    .select("id, file_name, storage_path, uploaded_at")
    .order("uploaded_at", { ascending: false });

  return { reports: data ?? [], error };
}

export default function ReportsPage() {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    fetchReports().then(({ reports, error }) => {
      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        setReports(reports);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("investment_reports")
      .insert({ user_id: user.id, file_name: file.name, storage_path: path });

    setUploading(false);
    event.target.value = "";

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const { reports: reloaded, error: reloadError } = await fetchReports();
    if (reloadError) {
      setError(reloadError.message);
      return;
    }
    setReports(reloaded);
  };

  const handleDownload = async (storagePath) => {
    setError(null);

    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60);

    if (signError) {
      setError(signError.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (report) => {
    setError(null);

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([report.storage_path]);

    if (removeError) {
      setError(removeError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("investment_reports")
      .delete()
      .eq("id", report.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const { reports: reloaded, error: reloadError } = await fetchReports();
    if (reloadError) {
      setError(reloadError.message);
      return;
    }
    setReports(reloaded);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Reports" subtitle="Upload and manage your PDF investment-analysis reports." />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        component="label"
        variant="contained"
        startIcon={<UploadFileIcon />}
        disabled={uploading}
        sx={{ mb: 3 }}
      >
        {uploading ? <CircularProgress size={24} /> : "Upload PDF"}
        <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
      </Button>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No reports uploaded yet.
        </Typography>
      ) : (
        <List disablePadding>
          {reports.map((report) => (
            <ListItem
              key={report.id}
              divider
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton aria-label="download" onClick={() => handleDownload(report.storage_path)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(report)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={report.file_name}
                secondary={new Date(report.uploaded_at).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
