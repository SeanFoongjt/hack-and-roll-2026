import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import type { User, Session } from "@supabase/supabase-js";

// Warm up browser for faster OAuth on mobile
if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

interface UseSupabaseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Hook for managing Supabase authentication state
 */
export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[Auth] State changed:", _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        // On web, use standard OAuth redirect flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
        if (error) throw error;
      } else {
        // On mobile, use expo-auth-session
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: "peptalkbuddy",
          path: "oauth/callback",
        });

        console.log("[Auth] Google sign-in redirect URL:", redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) throw error;

        if (data?.url) {
          // Open browser for authentication
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
            { showInRecents: true }
          );

          if (result.type === "success" && result.url) {
            // Parse the URL for the auth code
            const url = new URL(result.url);
            const code = url.searchParams.get("code");

            if (code) {
              console.log("[Auth] Exchanging code for session...");
              const { error: sessionError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (sessionError) throw sessionError;
              console.log("[Auth] Google sign-in successful");
            } else {
              const errorParam = url.searchParams.get("error");
              const errorDesc = url.searchParams.get("error_description");
              if (errorParam) {
                throw new Error(errorDesc || errorParam);
              }
            }
          } else if (result.type === "cancel") {
            console.log("[Auth] User cancelled Google sign-in");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
  };
}
