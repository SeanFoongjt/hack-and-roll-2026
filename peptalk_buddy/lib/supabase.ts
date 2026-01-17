import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Get Supabase credentials from environment
// You'll need to set these in your .env file:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_KEY=your-publishable-key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[Supabase] Missing credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your .env file"
  );
}

// Create Supabase client with AsyncStorage for React Native
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// Database types - these match your Supabase table structure
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          author: string;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          author: string;
          is_favorite?: boolean;
          created_at?: string;
        };
        Update: {
          text?: string;
          author?: string;
          is_favorite?: boolean;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          notification_frequency: "daily" | "twice_daily" | "custom";
          custom_times: string[];
          calendar_integration_enabled: boolean;
          google_calendar_connected: boolean;
          apple_calendar_connected: boolean;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_frequency?: "daily" | "twice_daily" | "custom";
          custom_times?: string[];
          calendar_integration_enabled?: boolean;
          google_calendar_connected?: boolean;
          apple_calendar_connected?: boolean;
          notifications_enabled?: boolean;
        };
        Update: {
          notification_frequency?: "daily" | "twice_daily" | "custom";
          custom_times?: string[];
          calendar_integration_enabled?: boolean;
          google_calendar_connected?: boolean;
          apple_calendar_connected?: boolean;
          notifications_enabled?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper functions for common operations

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("[Supabase] Error getting user:", error);
    return null;
  }
  return user;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Supabase] Error signing out:", error);
    throw error;
  }
}

/**
 * Get user settings from database
 */
export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("[Supabase] Error fetching settings:", error);
    return null;
  }
  return data;
}

/**
 * Upsert user settings
 */
export async function upsertUserSettings(
  userId: string,
  settings: Database["public"]["Tables"]["user_settings"]["Update"]
) {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error upserting settings:", error);
    throw error;
  }
  return data;
}

/**
 * Save a quote to user's history
 */
export async function saveQuote(
  userId: string,
  quote: { text: string; author: string }
) {
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      user_id: userId,
      text: quote.text,
      author: quote.author,
    })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error saving quote:", error);
    throw error;
  }
  return data;
}

/**
 * Get user's quote history
 */
export async function getQuoteHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] Error fetching quotes:", error);
    return [];
  }
  return data;
}

/**
 * Toggle favorite status for a quote
 */
export async function toggleFavoriteQuote(quoteId: string, isFavorite: boolean) {
  const { error } = await supabase
    .from("quotes")
    .update({ is_favorite: isFavorite })
    .eq("id", quoteId);

  if (error) {
    console.error("[Supabase] Error toggling favorite:", error);
    throw error;
  }
}

