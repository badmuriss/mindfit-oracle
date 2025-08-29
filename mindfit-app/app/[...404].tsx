import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useUser } from '../components/UserContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const { isLoggedIn } = useUser();

  useEffect(() => {
    // Redirect immediately to appropriate home page
    if (isLoggedIn) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  // Show loading while redirecting
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}