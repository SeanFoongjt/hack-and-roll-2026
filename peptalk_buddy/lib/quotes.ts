import { Platform } from "react-native";

export interface Quote {
  text: string;
  author: string;
  timestamp: number;
}

const FALLBACK_QUOTES = [
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

export async function fetchQuote(): Promise<Quote> {
  try {
    // Using API Ninjas quotes API
    const response = await fetch(
      "https://api.api-ninjas.com/v1/quotes?category=inspirational",
      {
        headers: {
          "X-Api-Key": process.env.NINJA_API_KEY || "",
        },
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          text: data[0].quote,
          author: data[0].author,
          timestamp: Date.now(),
        };
      }
    }

    // Fallback if API returns empty
    const randomQuote =
      FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return { ...randomQuote, timestamp: Date.now() };
  } catch (error) {
    console.error("Error fetching quote:", error);
    // Use fallback quote on error
    return {
      text: "Every day is a new beginning. Take a deep breath and start again.",
      author: "Unknown",
      timestamp: Date.now(),
    };
  }
}
