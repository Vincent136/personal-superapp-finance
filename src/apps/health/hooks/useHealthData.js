import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

// Maps the legacy localStorage key to the Supabase table name.
const TABLE_MAP = {
  health_cardio:  "health_cardio",
  health_sleep:   "health_sleep",
  health_body:    "health_body",
  health_journal: "health_journal",
};

// Converts a Supabase row into the flat record shape components expect.
// The `date` column is promoted to top-level; everything else from `data` is spread.
function rowToRecord(row) {
  return {
    id:        row.id,
    date:      row.date,
    createdAt: row.created_at,
    ...(row.data ?? {}),
  };
}

export function useHealthData(storageKey) {
  const { user } = useAuth();
  const table = TABLE_MAP[storageKey];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !table) return;
    let active = true;

    supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setRecords((data ?? []).map(rowToRecord));
        setLoading(false);
      });

    return () => { active = false; };
  }, [user, table]);

  const add = useCallback(async (record) => {
    if (!user || !table) return;
    // Extract `date` for the dedicated column; everything else goes into `data`.
    const { date, id: _id, createdAt: _ca, ...data } = record;
    const { data: inserted, error } = await supabase
      .from(table)
      .insert({
        user_id: user.id,
        date:    date ?? new Date().toISOString().slice(0, 10),
        data,
      })
      .select()
      .single();
    if (!error && inserted) {
      setRecords((prev) => [rowToRecord(inserted), ...prev]);
    }
  }, [user, table]);

  const update = useCallback(async (id, changes) => {
    if (!user || !table) return;
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    const merged = { ...existing, ...changes };
    const { date, id: _id, createdAt: _ca, ...data } = merged;

    const { data: updated, error } = await supabase
      .from(table)
      .update({ date: date ?? existing.date, data })
      .eq("id", id)
      .select()
      .single();
    if (!error && updated) {
      setRecords((prev) => prev.map((r) => r.id === id ? rowToRecord(updated) : r));
    }
  }, [user, table, records]);

  const remove = useCallback(async (id) => {
    if (!table) return;
    await supabase.from(table).delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, [table]);

  return { records, loading, add, update, remove };
}
