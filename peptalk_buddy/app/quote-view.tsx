import { View, Text, TouchableOpacity, Platform, Share } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

interface Quote {
  text: string;
  author: string;
  timestamp: number;
}

export default function QuoteViewScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  
  let quote: Quote | null = null;
  try {
    quote = params.quote ? JSON.parse(params.quote as string) : null;
  } catch (error) {
    console.error("Error parsing quote:", error);
  }

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (quote) {
      try {
        await Share.share({
          message: `"${quote.text}"\n\n— ${quote.author}\n\nShared from PepTalk Buddy`,
        });
      } catch (error) {
        console.error("Error sharing quote:", error);
      }
    }
  };

  if (!quote) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center p-6">
          <Text style={{ color: colors.foreground }} className="text-xl">
            No quote to display
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={{ backgroundColor: colors.primary }}
            className="mt-6 px-6 py-3 rounded-full"
          >
            <Text style={{ color: colors.surface }} className="font-semibold">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.accent, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View className="flex-1 justify-between p-8">
          {/* Close Button */}
          <View className="items-end">
            <TouchableOpacity
              onPress={handleClose}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
              className="w-12 h-12 rounded-full items-center justify-center"
            >
              <Text className="text-2xl text-white">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quote Content */}
          <View className="flex-1 justify-center items-center px-4">
            {/* Decorative Quote Mark */}
            <View className="mb-8">
              <Text className="text-8xl opacity-30" style={{ color: "white" }}>
                "
              </Text>
            </View>

            {/* Quote Text */}
            <Text
              className="text-3xl font-serif text-center leading-relaxed mb-8"
              style={{ color: "white", textShadowColor: "rgba(0, 0, 0, 0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}
            >
              {quote.text}
            </Text>

            {/* Author */}
            <Text
              className="text-xl text-center font-medium"
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              — {quote.author}
            </Text>

            {/* Decorative Elements */}
            <View className="mt-12 flex-row gap-4">
              <View
                style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                className="w-2 h-2 rounded-full"
              />
              <View
                style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}
                className="w-2 h-2 rounded-full"
              />
              <View
                style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                className="w-2 h-2 rounded-full"
              />
            </View>
          </View>

          {/* Share Button */}
          <View className="items-center">
            <TouchableOpacity
              onPress={handleShare}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
              }}
              className="px-8 py-4 rounded-full shadow-lg"
            >
              <Text
                style={{ color: colors.primary }}
                className="text-lg font-semibold"
              >
                📤 Share This Quote
              </Text>
            </TouchableOpacity>

            <Text
              className="text-sm mt-4"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Swipe down to close
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
