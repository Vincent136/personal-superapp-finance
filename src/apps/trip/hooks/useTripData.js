import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

// Converts a Supabase row into the flat trip object shape components expect.
function rowToTrip(row) {
  return {
    id:        row.id,
    title:     row.title,
    status:    row.status,
    createdAt: row.created_at,
    ...(row.data ?? {}),
  };
}

// Extract the path segment from a Supabase Storage public URL so we can delete it.
function storagePathFromUrl(url) {
  try {
    const match = url?.match?.(/trip-images\/(.+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function useTripData() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setTrips((data ?? []).map(rowToTrip));
        setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const addTrip = useCallback(async (tripData) => {
    if (!user) return null;

    // Callers may pre-assign an ID (needed when images are uploaded before insert).
    const { id: providedId, title, status, createdAt: _ca, ...rest } = tripData;
    const id = providedId ?? crypto.randomUUID();

    const data = {
      places:    rest.places    ?? [],
      expenses:  rest.expenses  ?? [],
      itinerary: rest.itinerary ?? [],
      images:    rest.images    ?? [],
      currency:  rest.currency  ?? "IDR",
      ...rest,
    };

    const { data: inserted, error } = await supabase
      .from("trips")
      .insert({
        id,
        user_id: user.id,
        title:   title ?? "Untitled",
        status:  status ?? "planning",
        data,
      })
      .select()
      .single();

    if (!error && inserted) {
      const trip = rowToTrip(inserted);
      setTrips((prev) => [trip, ...prev]);
      return trip;
    }
    return null;
  }, [user]);

  const updateTrip = useCallback(async (id, changes) => {
    if (!user) return;
    const existing = trips.find((t) => t.id === id);
    if (!existing) return;

    const merged = { ...existing, ...changes };
    const { id: _id, createdAt: _ca, title, status, ...data } = merged;

    // Optimistic UI update first
    setTrips((prev) => prev.map((t) => t.id === id ? merged : t));

    const { data: updated, error } = await supabase
      .from("trips")
      .update({ title: title ?? existing.title, status: status ?? existing.status, data })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Roll back optimistic update on error
      setTrips((prev) => prev.map((t) => t.id === id ? existing : t));
    } else if (updated) {
      setTrips((prev) => prev.map((t) => t.id === id ? rowToTrip(updated) : t));
    }
  }, [user, trips]);

  const deleteTrip = useCallback(async (id) => {
    if (!user) return;
    const trip = trips.find((t) => t.id === id);

    // Clean up images from Supabase Storage
    if (trip) {
      const urls = [
        ...(trip.images    ?? []),
        ...(trip.coverImage ? [trip.coverImage] : []),
      ].filter((u) => typeof u === "string" && u.startsWith("http"));

      const paths = urls.map(storagePathFromUrl).filter(Boolean);
      if (paths.length > 0) {
        supabase.storage.from("trip-images").remove(paths).catch(console.error);
      }
    }

    await supabase.from("trips").delete().eq("id", id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, [user, trips]);

  return { trips, loading, addTrip, updateTrip, deleteTrip };
}
