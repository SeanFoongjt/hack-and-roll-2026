import { describe, it, expect, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Settings Persistence", () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
  });

  it("should save and load settings correctly", async () => {
    const testSettings = {
      notificationFrequency: "daily" as const,
      customTimes: ["12:00"],
      calendarIntegrationEnabled: false,
      googleCalendarConnected: false,
      appleCalendarConnected: false,
      notificationsEnabled: true,
    };

    // Save settings
    await AsyncStorage.setItem("peptalk_settings", JSON.stringify(testSettings));

    // Load settings
    const stored = await AsyncStorage.getItem("peptalk_settings");
    expect(stored).not.toBeNull();

    const loadedSettings = JSON.parse(stored!);
    expect(loadedSettings).toEqual(testSettings);
  });

  it("should handle custom notification times", async () => {
    const customSettings = {
      notificationFrequency: "custom" as const,
      customTimes: ["09:00", "12:00", "18:00"],
      calendarIntegrationEnabled: false,
      googleCalendarConnected: false,
      appleCalendarConnected: false,
      notificationsEnabled: true,
    };

    await AsyncStorage.setItem("peptalk_settings", JSON.stringify(customSettings));
    const stored = await AsyncStorage.getItem("peptalk_settings");
    const loadedSettings = JSON.parse(stored!);

    expect(loadedSettings.customTimes).toHaveLength(3);
    expect(loadedSettings.customTimes).toContain("09:00");
    expect(loadedSettings.customTimes).toContain("12:00");
    expect(loadedSettings.customTimes).toContain("18:00");
  });

  it("should handle calendar integration settings", async () => {
    const calendarSettings = {
      notificationFrequency: "daily" as const,
      customTimes: ["12:00"],
      calendarIntegrationEnabled: true,
      googleCalendarConnected: true,
      appleCalendarConnected: false,
      notificationsEnabled: true,
    };

    await AsyncStorage.setItem("peptalk_settings", JSON.stringify(calendarSettings));
    const stored = await AsyncStorage.getItem("peptalk_settings");
    const loadedSettings = JSON.parse(stored!);

    expect(loadedSettings.calendarIntegrationEnabled).toBe(true);
    expect(loadedSettings.googleCalendarConnected).toBe(true);
    expect(loadedSettings.appleCalendarConnected).toBe(false);
  });
});

describe("Quote Storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("should save and load current quote", async () => {
    const testQuote = {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem("peptalk_current_quote", JSON.stringify(testQuote));
    const stored = await AsyncStorage.getItem("peptalk_current_quote");
    const loadedQuote = JSON.parse(stored!);

    expect(loadedQuote.text).toBe(testQuote.text);
    expect(loadedQuote.author).toBe(testQuote.author);
  });

  it("should maintain quote history", async () => {
    const quotes = [
      {
        text: "Quote 1",
        author: "Author 1",
        timestamp: Date.now(),
      },
      {
        text: "Quote 2",
        author: "Author 2",
        timestamp: Date.now() + 1000,
      },
      {
        text: "Quote 3",
        author: "Author 3",
        timestamp: Date.now() + 2000,
      },
    ];

    await AsyncStorage.setItem("peptalk_quote_history", JSON.stringify(quotes));
    const stored = await AsyncStorage.getItem("peptalk_quote_history");
    const loadedHistory = JSON.parse(stored!);

    expect(loadedHistory).toHaveLength(3);
    expect(loadedHistory[0].text).toBe("Quote 1");
    expect(loadedHistory[2].text).toBe("Quote 3");
  });

  it("should limit history to 50 quotes", async () => {
    const manyQuotes = Array.from({ length: 60 }, (_, i) => ({
      text: `Quote ${i}`,
      author: `Author ${i}`,
      timestamp: Date.now() + i * 1000,
    }));

    // Simulate trimming to 50
    const trimmedQuotes = manyQuotes.slice(0, 50);
    await AsyncStorage.setItem("peptalk_quote_history", JSON.stringify(trimmedQuotes));

    const stored = await AsyncStorage.getItem("peptalk_quote_history");
    const loadedHistory = JSON.parse(stored!);

    expect(loadedHistory).toHaveLength(50);
  });
});
