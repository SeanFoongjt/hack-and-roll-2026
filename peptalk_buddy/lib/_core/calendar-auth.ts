import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const GOOGLE_CALENDAR_TOKEN_KEY = "google_calendar_tokens";

export type GoogleCalendarTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope?: string;
  tokenType?: string;
  test?: {
    calendarCount: number;
    responseText?: string;
  };
};

async function readStorage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(GOOGLE_CALENDAR_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(GOOGLE_CALENDAR_TOKEN_KEY);
}

async function writeStorage(value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    if (value === null) {
      window.localStorage.removeItem(GOOGLE_CALENDAR_TOKEN_KEY);
      return;
    }
    window.localStorage.setItem(GOOGLE_CALENDAR_TOKEN_KEY, value);
    return;
  }
  if (value === null) {
    await SecureStore.deleteItemAsync(GOOGLE_CALENDAR_TOKEN_KEY);
    return;
  }
  await SecureStore.setItemAsync(GOOGLE_CALENDAR_TOKEN_KEY, value);
}

export async function getGoogleCalendarTokens(): Promise<GoogleCalendarTokens | null> {
  try {
    const raw = await readStorage();
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as GoogleCalendarTokens;
  } catch (error) {
    console.error("[CalendarAuth] Failed to read Google tokens:", error);
    return null;
  }
}

export async function setGoogleCalendarTokens(tokens: GoogleCalendarTokens): Promise<void> {
  try {
    await writeStorage(JSON.stringify(tokens));
  } catch (error) {
    console.error("[CalendarAuth] Failed to store Google tokens:", error);
    throw error;
  }
}

export async function clearGoogleCalendarTokens(): Promise<void> {
  try {
    await writeStorage(null);
  } catch (error) {
    console.error("[CalendarAuth] Failed to clear Google tokens:", error);
  }
}
