import Constants from 'expo-constants';

// Helper: choose first non-empty string
function pickString(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    }
  }
  return undefined;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

// Resolve API base URL from Expo config/env.
// Guard against objects to prevent "[object Object]" ending up in URLs.
const expoExtra = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra || {};
const resolvedFromExpo = pickString(expoExtra.apiBaseUrl, expoExtra.API_BASE_URL);
const resolvedFromEnv = pickString(process.env.EXPO_PUBLIC_API_BASE_URL, process.env.API_BASE_URL);

const API_BASE_URL: string = stripTrailingSlash(
  pickString(resolvedFromExpo, resolvedFromEnv) || 'http://localhost:8088'
);

// USDA API configuration
const resolvedUsdaFromExpo = pickString(expoExtra.usdaApiKey, expoExtra.USDA_API_KEY);
const resolvedUsdaFromEnv = pickString(process.env.EXPO_PUBLIC_USDA_API_KEY, process.env.USDA_API_KEY);
const USDA_API_KEY: string = pickString(resolvedUsdaFromExpo, resolvedUsdaFromEnv) || 'DEMO_KEY';

const baseUrl = API_BASE_URL;

export { API_BASE_URL, USDA_API_KEY };

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${baseUrl}/auth/user/login`,
    SIGNUP: `${baseUrl}/auth/user/signup`,
  },
  USERS: {
    PROFILE: (userId: string) => `${baseUrl}/users/${userId}`,
    MEALS: (userId: string) => `${baseUrl}/users/${userId}/meals`,
    MEAL_BY_ID: (userId: string, mealId: string | number) => `${baseUrl}/users/${userId}/meals/${encodeURIComponent(String(mealId))}`,
    EXERCISES: (userId: string) => `${baseUrl}/users/${userId}/exercises`,
    EXERCISE_BY_ID: (userId: string, exerciseId: string | number) => `${baseUrl}/users/${userId}/exercises/${encodeURIComponent(String(exerciseId))}`,
    MEASUREMENTS: (userId: string) => `${baseUrl}/users/${userId}/measurements`,
    CHATBOT: (userId: string) => `${baseUrl}/users/${userId}/chatbot`,
    CHATBOT_ACTIONS: (userId: string) => `${baseUrl}/users/${userId}/chatbot/actions/execute`,
    GENERATE_PROFILE: (userId: string) => `${baseUrl}/users/${userId}/generate-profile`,
    RECOMMEND_WORKOUT: (userId: string) => `${baseUrl}/users/${userId}/recommend-workout`,
    MEAL_RECOMMENDATIONS: (userId: string) => `${baseUrl}/users/${userId}/meal-recommendations`,
    WORKOUT_RECOMMENDATIONS: (userId: string) => `${baseUrl}/users/${userId}/workout-recommendations`,
    GENERATE_NEW_MEAL_RECOMMENDATIONS: (userId: string) => `${baseUrl}/users/${userId}/meal-recommendations/generate`,
    GENERATE_NEW_WORKOUT_RECOMMENDATIONS: (userId: string) => `${baseUrl}/users/${userId}/workout-recommendations/generate`,
  },
};
