import { ScrollView, Text, View, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

interface Quote {
  text: string;
  author: string;
  timestamp: number;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeScreen() {
  const colors = useColors();
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextNotificationTime, setNextNotificationTime] = useState<string>("");

  useEffect(() => {
    loadCurrentQuote();
    requestNotificationPermissions();
    setupNotificationListener();
    calculateNextNotification();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      alert("Please enable notifications to receive pep talks!");
    }
  };

  const setupNotificationListener = () => {
    // Handle notification tap
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const quote = response.notification.request.content.data.quote as Quote;
      if (quote) {
        setCurrentQuote(quote);
        // Quote will be displayed on home screen
      }
    });

    return () => subscription.remove();
  };

  const loadCurrentQuote = async () => {
    try {
      const stored = await AsyncStorage.getItem("peptalk_current_quote");
      if (stored) {
        setCurrentQuote(JSON.parse(stored));
      } else {
        // Load initial quote
        await fetchNewQuote();
      }
    } catch (error) {
      console.error("Error loading quote:", error);
    }
  };

  const fetchNewQuote = async () => {
    setLoading(true);
    try {
      // Using API Ninjas quotes API
      const response = await fetch("https://api.api-ninjas.com/v2/quotes?category=inspirational", {
        headers: {
          "X-Api-Key": "ILRvIY5z0ezHEK0PV5mkHJhIQwmG5eMthdqrHjyl", // In production, this should be in env vars
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const quote: Quote = {
            text: data[0].quote,
            author: data[0].author,
            timestamp: Date.now(),
          };
          setCurrentQuote(quote);
          await AsyncStorage.setItem("peptalk_current_quote", JSON.stringify(quote));
          
          // Save to history
          await saveToHistory(quote);
        }
      } else {
        // Fallback quotes if API fails
        const fallbackQuotes = [
          {
            text: "Believe you can and you're halfway there.",
            author: "Theodore Roosevelt",
            timestamp: Date.now(),
          },
          {
            text: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
            timestamp: Date.now(),
          },
          {
            text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            author: "Winston Churchill",
            timestamp: Date.now(),
          },
        ];
        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setCurrentQuote(randomQuote);
        await AsyncStorage.setItem("peptalk_current_quote", JSON.stringify(randomQuote));
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      // Use fallback quote on error
      const fallbackQuote: Quote = {
        text: "Every day is a new beginning. Take a deep breath and start again.",
        author: "Unknown",
        timestamp: Date.now(),
      };
      setCurrentQuote(fallbackQuote);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (quote: Quote) => {
    try {
      const stored = await AsyncStorage.getItem("peptalk_quote_history");
      const history: Quote[] = stored ? JSON.parse(stored) : [];
      history.unshift(quote);
      // Keep only last 50 quotes
      const trimmedHistory = history.slice(0, 50);
      await AsyncStorage.setItem("peptalk_quote_history", JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const handleRefresh = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await fetchNewQuote();
  };

  const calculateNextNotification = async () => {
    try {
      const stored = await AsyncStorage.getItem("peptalk_settings");
      if (stored) {
        const settings = JSON.parse(stored);
        const times = settings.customTimes || ["12:00"];
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Find next notification time
        for (const time of times) {
          const [hours, minutes] = time.split(":").map(Number);
          const notificationTime = hours * 60 + minutes;
          
          if (notificationTime > currentTime) {
            setNextNotificationTime(time);
            return;
          }
        }
        
        // If no time found today, show first time tomorrow
        setNextNotificationTime(`${times[0]} (tomorrow)`);
      }
    } catch (error) {
      console.error("Error calculating next notification:", error);
    }
  };

  const handleQuoteTap = () => {
    if (currentQuote) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push({
        pathname: "/quote-view" as any,
        params: { quote: JSON.stringify(currentQuote) },
      });
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6 justify-center">
          {/* App Title */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">PepTalk Buddy</Text>
            <Text className="text-base text-muted text-center">
              Your daily dose of motivation
            </Text>
          </View>

          {/* Quote Card */}
          <TouchableOpacity
            onPress={handleQuoteTap}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="w-full rounded-3xl p-8 border-2 shadow-lg min-h-[300px] justify-center"
          >
            {loading ? (
              <View className="items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-muted mt-4">Loading inspiration...</Text>
              </View>
            ) : currentQuote ? (
              <View className="gap-6">
                {/* Quote Icon */}
                <View className="items-center">
                  <View
                    style={{ backgroundColor: colors.accent }}
                    className="w-16 h-16 rounded-full items-center justify-center"
                  >
                    <Text className="text-3xl">💬</Text>
                  </View>
                </View>

                {/* Quote Text */}
                <Text
                  style={{ color: colors.foreground }}
                  className="text-2xl font-serif text-center leading-relaxed"
                >
                  "{currentQuote.text}"
                </Text>

                {/* Author */}
                <Text
                  style={{ color: colors.muted }}
                  className="text-lg text-center font-medium"
                >
                  — {currentQuote.author}
                </Text>

                {/* Tap hint */}
                <Text
                  style={{ color: colors.muted }}
                  className="text-xs text-center mt-2"
                >
                  Tap to view full screen
                </Text>
              </View>
            ) : (
              <Text className="text-center text-muted">
                Tap refresh to get your first pep talk!
              </Text>
            )}
          </TouchableOpacity>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading}
            style={{
              backgroundColor: colors.primary,
              opacity: loading ? 0.6 : 1,
            }}
            className="px-8 py-4 rounded-full items-center self-center shadow-md"
          >
            <Text
              style={{ color: colors.surface }}
              className="text-lg font-semibold"
            >
              {loading ? "Loading..." : "🔄 Get New Pep Talk"}
            </Text>
          </TouchableOpacity>

          {/* Next Notification Info */}
          {nextNotificationTime && (
            <View
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
              }}
              className="p-4 rounded-2xl border items-center"
            >
              <Text style={{ color: colors.muted }} className="text-sm">
                Next notification
              </Text>
              <Text
                style={{ color: colors.foreground }}
                className="text-lg font-semibold mt-1"
              >
                {nextNotificationTime}
              </Text>
            </View>
          )}

          {/* Info Card */}
          <View
            style={{
              backgroundColor: colors.accent,
            }}
            className="p-4 rounded-2xl"
          >
            <Text
              style={{ color: colors.foreground }}
              className="text-sm text-center leading-relaxed"
            >
              💡 Tip: Visit Settings to customize your notification schedule and connect your calendar for personalized pep talks!
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
