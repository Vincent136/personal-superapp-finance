import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, type")
      .order("name");

    if (!error) setCategories(data ?? []);
  };

  useEffect(() => {
    let active = true;

    supabase
      .from("categories")
      .select("id, name, type")
      .order("name")
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setCategories(data ?? []);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const incomeCategories = categories.filter((category) => category.type === "income");
  const expenseCategories = categories.filter((category) => category.type === "expense");

  return { categories, incomeCategories, expenseCategories, loading, reload };
}
