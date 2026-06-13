import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const location = useLocation();

  const [mode, setMode] = useState("signIn"); // "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (session) {
    return <Navigate to={location.state?.from?.pathname ?? "/"} replace />;
  }

  const isSignUp = mode === "signUp";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (isSignUp) {
      const { data: allowed, error: checkError } = await supabase.rpc("is_email_allowed", {
        check_email: email,
      });

      if (checkError) {
        setError(checkError.message);
        setSubmitting(false);
        return;
      }

      if (!allowed) {
        setError("This email isn't authorized to create an account. Ask an admin to whitelist it first.");
        setSubmitting(false);
        return;
      }
    }

    const { error } = isSignUp
      ? await signUp({ email, password })
      : await signIn({ email, password });

    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else if (isSignUp) {
      setInfo("Account created. Check your email to confirm before signing in.");
    }
  };

  const toggleMode = () => {
    setMode(isSignUp ? "signIn" : "signUp");
    setError(null);
    setInfo(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {isSignUp ? "Create account" : "Sign in"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isSignUp
            ? "Sign up to start tracking your finances."
            : "Welcome back. Enter your details to continue."}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : isSignUp ? "Create account" : "Sign in"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <Link component="button" type="button" onClick={toggleMode}>
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
