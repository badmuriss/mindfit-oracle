import Constants from 'expo-constants';

// Resolve API base URL from Expo config (set in app.json during Docker build)
const resolvedFromExpo = (Constants?.expoConfig as any)?.extra?.apiBaseUrl
  || (Constants as any)?.manifest?.extra?.apiBaseUrl;

// Fallback to env (if present) or default to 8088
const API_BASE_URL: string = (resolvedFromExpo as string)
  || (process.env.API_BASE_URL as string)
  || 'http://localhost:8088';

const baseUrl = API_BASE_URL;

console.log('API_BASE_URL resolved:', API_BASE_URL);

export { API_BASE_URL };

console.log('baseUrl being used in endpoints:', baseUrl, 'type:', typeof baseUrl);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${baseUrl}/auth/user/login`,
    SIGNUP: `${baseUrl}/auth/user/signup`,
  },
  USERS: {
    PROFILE: (userId: string) => {
      const url = `${baseUrl}/users/${userId}`;
      console.log('PROFILE URL:', url);
      return url;
    },
    MEALS: (userId: string, pageable?: string) => {
      const url = `${baseUrl}/users/${userId}/meals${pageable ? `?pageable=${pageable}` : ''}`;
      console.log('MEALS URL:', url);
      return url;
    },
    MEAL_BY_ID: (userId: string, mealId: string | number) => {
      const url = `${baseUrl}/users/${userId}/meals/${encodeURIComponent(String(mealId))}`;
      console.log('MEAL_BY_ID URL:', url);
      return url;
    },
    EXERCISES: (userId: string, pageable?: string) => {
      const url = `${baseUrl}/users/${userId}/exercises${pageable ? `?pageable=${pageable}` : ''}`;
      console.log('EXERCISES URL:', url);
      return url;
    },
    EXERCISE_BY_ID: (userId: string, exerciseId: string | number) => {
      const url = `${baseUrl}/users/${userId}/exercises/${encodeURIComponent(String(exerciseId))}`;
      console.log('EXERCISE_BY_ID URL:', url);
      return url;
    },
    MEASUREMENTS: (userId: string, pageable?: string) => {
      const url = `${baseUrl}/users/${userId}/measurements${pageable ? `?pageable=${pageable}` : ''}`;
      console.log('MEASUREMENTS URL:', url);
      return url;
    },
    CHATBOT: (userId: string) => {
      const url = `${baseUrl}/users/${userId}/chatbot`;
      console.log('CHATBOT URL:', url);
      return url;
    },
  },
};
