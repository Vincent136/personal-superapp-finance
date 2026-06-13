import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PageHeader from "../../components/common/PageHeader";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";

function CategorySection({ title, type, items, onChanged }) {
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return;

    setError(null);
    setSubmitting(true);

    const { error } = await supabase
      .from("categories")
      .insert({ name: newName.trim(), type, user_id: user.id });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setNewName("");
    onChanged();
  };

  const startEdit = (category) => {
    setError(null);
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingName.trim()) return;

    setError(null);
    const { error } = await supabase
      .from("categories")
      .update({ name: editingName.trim() })
      .eq("id", editingId);

    if (error) {
      setError(error.message);
      return;
    }

    cancelEdit();
    onChanged();
  };

  const handleDelete = async (id) => {
    setError(null);
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    onChanged();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No {title.toLowerCase()} yet.
        </Typography>
      ) : (
        <List disablePadding sx={{ mb: 2 }}>
          {items.map((category) => (
            <ListItem
              key={category.id}
              divider
              secondaryAction={
                editingId === category.id ? (
                  <>
                    <IconButton edge="end" aria-label="save" onClick={saveEdit}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="cancel" onClick={cancelEdit}>
                      <CloseIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton edge="end" aria-label="edit" onClick={() => startEdit(category)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(category.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                )
              }
            >
              {editingId === category.id ? (
                <TextField
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mr: 9 }}
                />
              ) : (
                <ListItemText primary={category.name} />
              )}
            </ListItem>
          ))}
        </List>
      )}

      <Box component="form" onSubmit={handleAdd} sx={{ display: "flex", gap: 2 }}>
        <TextField
          label={`New ${type} category`}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          size="small"
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : "Add"}
        </Button>
      </Box>
    </Box>
  );
}

export default function CategoriesPage() {
  const { incomeCategories, expenseCategories, loading, reload } = useCategories();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Categories" subtitle="Manage your income and expense categories." />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <CategorySection
            title="Income categories"
            type="income"
            items={incomeCategories}
            onChanged={reload}
          />
          <Divider sx={{ mb: 4 }} />
          <CategorySection
            title="Expense categories"
            type="expense"
            items={expenseCategories}
            onChanged={reload}
          />
        </>
      )}
    </Box>
  );
}
