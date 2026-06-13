import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncAdmin = async (session) => {
      if (!session) {
        if (active) {
          setIsAdmin(false);
          setAdminLoading(false);
        }
        return;
      }

      const { data } = await supabase.rpc("is_admin");
      if (active) {
        setIsAdmin(Boolean(data));
        setAdminLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      syncAdmin(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      setAdminLoading(true);
      syncAdmin(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isAdmin,
    adminLoading,
    signIn: ({ email, password }) => supabase.auth.signInWithPassword({ email, password }),
    signUp: ({ email, password }) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
