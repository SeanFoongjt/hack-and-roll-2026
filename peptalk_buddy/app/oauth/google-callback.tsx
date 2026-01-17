import { ThemedView } from "@/components/themed-view";
import * as CalendarAuth from "@/lib/_core/calendar-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CallbackParams = {
  status?: string;
  payload?: string;
  error?: string;
};

type SettingsPayload = {
  googleCalendarConnected: boolean;
};

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(normalized);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(normalized, "base64").toString("utf-8");
  }
  return normalized;
}

async function updateSettings(update: SettingsPayload) {
  const stored = await AsyncStorage.getItem("peptalk_settings");
  const settings = stored ? JSON.parse(stored) : {};
  const next = { ...settings, ...update };
  await AsyncStorage.setItem("peptalk_settings", JSON.stringify(next));
}

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<CallbackParams>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState<string>("Connecting to Google Calendar...");

  useEffect(() => {
    const handleCallback = async () => {
      if (params.error || params.status === "error") {
        setStatus("error");
        setMessage(params.error || "Google Calendar connection failed.");
        return;
      }

      if (!params.payload) {
        setStatus("error");
        setMessage("Missing Google Calendar payload.");
        return;
      }

      try {
        const decoded = decodeBase64Url(params.payload);
        const payload = JSON.parse(decoded) as CalendarAuth.GoogleCalendarTokens;

        await CalendarAuth.setGoogleCalendarTokens(payload);
        await updateSettings({ googleCalendarConnected: true });

        setStatus("success");
        setMessage("Google Calendar connected!");

        setTimeout(() => {
          router.replace("/(tabs)/settings");
        }, 1000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to store Google Calendar tokens.",
        );
      }
    };

    handleCallback();
  }, [params.error, params.payload, params.status, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              {message}
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">{message}</Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecting to settings...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Connection failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">{message}</Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
