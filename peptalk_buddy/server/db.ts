import type { InsertUser, User } from "../shared/types";
import { ENV } from "./_core/env";

type SupabaseUserRow = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};

const getSupabaseHeaders = () => {
  return {
    apikey: ENV.supabaseServiceRoleKey,
    Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
  };
};

const getSupabaseBaseUrl = () => {
  return ENV.supabaseUrl.replace(/\/$/, "");
};

const toUser = (row: SupabaseUserRow): User => {
  return {
    id: row.id,
    openId: row.openId,
    name: row.name,
    email: row.email,
    loginMethod: row.loginMethod,
    role: row.role,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    lastSignedIn: new Date(row.lastSignedIn),
  };
};

const isSupabaseConfigured = () => {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    console.warn("[Database] Supabase is not configured");
    return false;
  }
  return true;
};

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    const payload = {
      openId: values.openId,
      name: values.name ?? null,
      email: values.email ?? null,
      loginMethod: values.loginMethod ?? null,
      role: values.role ?? "user",
      lastSignedIn: values.lastSignedIn?.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const url = `${getSupabaseBaseUrl()}/rest/v1/users?on_conflict=openId`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[Database] Supabase upsert failed: ${errorText}`);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const encodedOpenId = encodeURIComponent(openId);
  const url = `${getSupabaseBaseUrl()}/rest/v1/users?openId=eq.${encodedOpenId}&limit=1`;
  const response = await fetch(url, {
    method: "GET",
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn("[Database] Supabase get user failed:", errorText);
    return undefined;
  }

  const rows = (await response.json()) as SupabaseUserRow[];
  if (!rows.length) return undefined;

  return toUser(rows[0]);
}

// TODO: add feature queries here as your schema grows.
