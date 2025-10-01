import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../constants/Api';

export default function Middleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasVerified = useRef(false);

  useEffect(() => {
    const checkAndVerifyToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      // If user has token, prevent access to login/signup
      if (token && (pathname === '/login' || pathname === '/signup')) {
        router.replace('/(tabs)/home');
        return;
      }

      // If user does NOT have token and is trying to access protected routes (tabs), redirect to login
      const isProtected = pathname.startsWith('/(tabs)') || pathname === '/' || pathname === '/home';
      if (!token && isProtected && pathname !== '/login' && pathname !== '/signup' && pathname !== '/onboarding') {
        router.replace('/login');
        return;
      }

      // Verify token with API if user is logged in and hasn't been verified yet
      if (token && userId && isProtected && !hasVerified.current) {
        hasVerified.current = true;

        try {
          const response = await fetch(API_ENDPOINTS.USERS.PROFILE(userId), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });

          // If 401, token is invalid - logout and redirect
          if (response.status === 401) {
            console.log('Middleware: Token invalid (401) - logging out');
            await AsyncStorage.multiRemove(['userToken', 'userName', 'userEmail', 'userId']);
            hasVerified.current = false;
            router.replace('/login');
            return;
          }

        } catch (error) {
          console.error('Middleware: Error verifying token:', error);
          // On network error, allow access (offline mode)
        }
      }
    };

    checkAndVerifyToken();
  }, [pathname, router]);

  return <>{children}</>;
}
