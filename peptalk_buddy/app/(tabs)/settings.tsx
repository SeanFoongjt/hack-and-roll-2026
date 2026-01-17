import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchQuote } from "@/lib/quotes";

type NotificationFrequency = "daily" | "twice_daily" | "custom";

interface Settings {
  notificationFrequency: NotificationFrequency;
  customTimes: string[];
  savedCustomTimes?: string[];
  calendarIntegrationEnabled: boolean;
  googleCalendarConnected: boolean;
  appleCalendarConnected: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  notificationFrequency: "daily",
  customTimes: ["12:00"],
  calendarIntegrationEnabled: false,
  googleCalendarConnected: false,
  appleCalendarConnected: false,
  notificationsEnabled: true,
};

export default function SettingsScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem("peptalk_settings");
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(
        "peptalk_settings",
        JSON.stringify(newSettings),
      );
      setSettings(newSettings);
      scheduleNotifications(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const scheduleNotifications = async (currentSettings: Settings) => {
    try {
      if (Platform.OS === "web") return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!currentSettings.notificationsEnabled) return;

      // Use the customTimes array directly as it is kept in sync with frequency
      // by the handleFrequencyChange function.
      const timesToSchedule = currentSettings.customTimes;

      for (const timeStr of timesToSchedule) {
        const [hours, minutes] = timeStr.split(":").map(Number);

        // Fetch a fresh quote for the notification
        const quote = await fetchQuote();

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "PepTalk Buddy",
            body: `"${quote.text}"`,
            data: { quote },
            subtitle: quote.author, // Shows author effectively on iOS
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  };

  const handleFrequencyChange = (frequency: NotificationFrequency) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let customTimes = settings.customTimes;
    let savedCustomTimes = settings.savedCustomTimes || [];

    // Save current custom times if we are currently in "custom" mode and switching away
    if (settings.notificationFrequency === "custom" && frequency !== "custom") {
      savedCustomTimes = [...customTimes];
    }

    if (frequency === "daily") {
      customTimes = ["12:00"];
    } else if (frequency === "twice_daily") {
      customTimes = ["12:00", "18:00"];
    } else if (frequency === "custom") {
      // Restore saved times if available, otherwise default
      if (savedCustomTimes.length > 0) {
        customTimes = savedCustomTimes;
      } else if (customTimes.length === 0) {
        customTimes = ["09:00"];
      }
    }

    saveSettings({
      ...settings,
      notificationFrequency: frequency,
      customTimes,
      savedCustomTimes,
    });
  };

  const handleCalendarToggle = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveSettings({ ...settings, calendarIntegrationEnabled: value });
  };

  const handleNotificationsToggle = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveSettings({ ...settings, notificationsEnabled: value });
  };

  const handleGoogleCalendarConnect = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement Google Calendar OAuth
    alert("Google Calendar integration coming soon!");
  };

  const handleAppleCalendarConnect = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement Apple Calendar OAuth
    alert("Apple Calendar integration coming soon!");
  };

  const addCustomTime = () => {
    if (settings.customTimes.length >= 3) {
      alert("Maximum 3 notifications per day");
      return;
    }
    setShowTimePicker(true);
  };

  const handleTimeConfirm = (selectedDate?: Date) => {
    const date = selectedDate || tempTime;
    const timeString = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    if (!settings.customTimes.includes(timeString)) {
      saveSettings({
        ...settings,
        customTimes: [...settings.customTimes, timeString].sort(),
      });
    }
    setShowTimePicker(false);
  };

  const removeCustomTime = (time: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    saveSettings({
      ...settings,
      customTimes: settings.customTimes.filter((t) => t !== time),
    });
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Settings</Text>
            <Text className="text-base text-muted">
              Customize your pep talk notifications
            </Text>
          </View>

          {/* Notifications Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  Notifications
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Enable or disable all notifications
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.surface}
              />
            </View>
          </View>

          {/* Frequency Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Notification Frequency
            </Text>
            <Text className="text-sm text-muted mb-4">
              Choose how often you receive pep talks (max 3 per day)
            </Text>

            <View className="gap-3">
              {/* Daily Option */}
              <TouchableOpacity
                onPress={() => handleFrequencyChange("daily")}
                style={{
                  backgroundColor:
                    settings.notificationFrequency === "daily"
                      ? colors.primary
                      : colors.background,
                  opacity: settings.notificationFrequency === "daily" ? 1 : 0.7,
                }}
                className="p-4 rounded-xl border border-border"
              >
                <Text
                  style={{
                    color:
                      settings.notificationFrequency === "daily"
                        ? colors.surface
                        : colors.foreground,
                  }}
                  className="font-semibold"
                >
                  Once Daily (12:00 PM)
                </Text>
              </TouchableOpacity>

              {/* Twice Daily Option */}
              <TouchableOpacity
                onPress={() => handleFrequencyChange("twice_daily")}
                style={{
                  backgroundColor:
                    settings.notificationFrequency === "twice_daily"
                      ? colors.primary
                      : colors.background,
                  opacity:
                    settings.notificationFrequency === "twice_daily" ? 1 : 0.7,
                }}
                className="p-4 rounded-xl border border-border"
              >
                <Text
                  style={{
                    color:
                      settings.notificationFrequency === "twice_daily"
                        ? colors.surface
                        : colors.foreground,
                  }}
                  className="font-semibold"
                >
                  Twice Daily (12:00 PM & 6:00 PM)
                </Text>
              </TouchableOpacity>

              {/* Custom Time Option */}
              <TouchableOpacity
                onPress={() => handleFrequencyChange("custom")}
                style={{
                  backgroundColor:
                    settings.notificationFrequency === "custom"
                      ? colors.primary
                      : colors.background,
                  opacity:
                    settings.notificationFrequency === "custom" ? 1 : 0.7,
                }}
                className="p-4 rounded-xl border border-border"
              >
                <Text
                  style={{
                    color:
                      settings.notificationFrequency === "custom"
                        ? colors.surface
                        : colors.foreground,
                  }}
                  className="font-semibold mb-2"
                >
                  Custom Times
                </Text>
                {settings.notificationFrequency === "custom" && (
                  <View className="gap-2 mt-2">
                    {settings.customTimes.map((time) => (
                      <View
                        key={time}
                        className="flex-row items-center justify-between bg-background p-2 rounded-lg"
                      >
                        <Text style={{ color: colors.foreground }}>{time}</Text>
                        <TouchableOpacity
                          onPress={() => removeCustomTime(time)}
                        >
                          <Text style={{ color: colors.error }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    {settings.customTimes.length < 3 && (
                      <TouchableOpacity
                        onPress={addCustomTime}
                        style={{ backgroundColor: colors.accent }}
                        className="p-2 rounded-lg items-center"
                      >
                        <Text
                          style={{ color: colors.foreground }}
                          className="font-semibold"
                        >
                          + Add Time
                        </Text>
                      </TouchableOpacity>
                    )}
                    {/* Time Picker Modal */}
                    {showTimePicker && (
                      <View className="mt-4">
                        <DateTimePicker
                          value={tempTime}
                          mode="time"
                          is24Hour={false}
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(event: any, selectedDate?: Date) => {
                            if (Platform.OS === "android") {
                              if (event.type === "set" && selectedDate) {
                                setTempTime(selectedDate);
                                handleTimeConfirm(selectedDate);
                              } else {
                                setShowTimePicker(false);
                              }
                            } else {
                              // iOS logic: just update temp state
                              if (selectedDate) {
                                setTempTime(selectedDate);
                              }
                            }
                          }}
                        />
                        {Platform.OS === "ios" && (
                          <View className="flex-row justify-center gap-4 mt-2">
                            <TouchableOpacity
                              onPress={() => setShowTimePicker(false)}
                              className="p-3 px-6 rounded-xl border border-border bg-background"
                            >
                              <Text style={{ color: colors.foreground }}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleTimeConfirm(tempTime)}
                              className="p-3 px-6 rounded-xl shadow-sm"
                              style={{ backgroundColor: colors.primary }}
                            >
                              <Text
                                style={{ color: colors.surface }}
                                className="font-semibold"
                              >
                                Save Time
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar Integration Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Calendar Integration
            </Text>
            <Text className="text-sm text-muted mb-4">
              Get personalized pep talks before important events
            </Text>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-base text-foreground">
                  Event-based notifications
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Receive pep talks 1 hour before key events
                </Text>
              </View>
              <Switch
                value={settings.calendarIntegrationEnabled}
                onValueChange={handleCalendarToggle}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.surface}
              />
            </View>

            {settings.calendarIntegrationEnabled && (
              <View className="gap-3 mt-2">
                <TouchableOpacity
                  onPress={handleGoogleCalendarConnect}
                  style={{
                    backgroundColor: settings.googleCalendarConnected
                      ? colors.success
                      : colors.background,
                  }}
                  className="p-4 rounded-xl border border-border"
                >
                  <Text
                    style={{
                      color: settings.googleCalendarConnected
                        ? colors.surface
                        : colors.foreground,
                    }}
                    className="font-semibold text-center"
                  >
                    {settings.googleCalendarConnected ? "✓ " : ""}
                    Connect Google Calendar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAppleCalendarConnect}
                  style={{
                    backgroundColor: settings.appleCalendarConnected
                      ? colors.success
                      : colors.background,
                  }}
                  className="p-4 rounded-xl border border-border"
                >
                  <Text
                    style={{
                      color: settings.appleCalendarConnected
                        ? colors.surface
                        : colors.foreground,
                    }}
                    className="font-semibold text-center"
                  >
                    {settings.appleCalendarConnected ? "✓ " : ""}
                    Connect Apple Calendar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
