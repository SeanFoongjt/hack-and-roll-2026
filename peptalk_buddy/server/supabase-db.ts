/**
 * Server-side Supabase client for backend operations
 * Uses service role key for admin access (bypasses RLS)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";

// Server-side Supabase client with service role key
// This bypasses Row Level Security - use carefully!
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get the admin Supabase client (server-side only)
 * Uses service role key to bypass RLS
 */
export function getSupabaseAdmin() {
  if (!_supabaseAdmin && supabaseUrl && supabaseServiceKey) {
    _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

/**
 * Get user by their Supabase auth ID
 */
export async function getUserById(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[Supabase] Admin client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[Supabase] Error fetching user:", error);
    return null;
  }
  return data;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[Supabase] Admin client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Supabase] Error fetching user by email:", error);
    return null;
  }
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; email?: string; avatar_url?: string }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[Supabase] Admin client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error updating user:", error);
    throw error;
  }
  return data;
}

/**
 * Get all quotes for a user (admin access)
 */
export async function getAllUserQuotes(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[Supabase] Admin client not available");
    return [];
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] Error fetching quotes:", error);
    return [];
  }
  return data;
}

/**
 * Get user settings (admin access)
 */
export async function getAdminUserSettings(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[Supabase] Admin client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Supabase] Error fetching settings:", error);
    return null;
  }
  return data;
}

