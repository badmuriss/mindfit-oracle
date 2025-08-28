import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Middleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      // If user has token, prevent access to login/signup
      if (token && (pathname === '/login' || pathname === '/signup')) {
        router.replace('/(tabs)/home');
        return;
      }

      // If user does NOT have token and is trying to access protected routes (tabs), redirect to login
      const isProtected = pathname.startsWith('/(tabs)') || pathname === '/' || pathname === '/home';
      if (!token && isProtected && pathname !== '/login' && pathname !== '/signup' && pathname !== '/onboarding') {
        router.replace('/login');
      }
    };
    checkToken();
  }, [pathname, router]);

  return <>{children}</>;
}
