import { Slot, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';

import { UserProvider, useUser } from '../components/UserContext';

function Inner() {
  const { isLoggedIn, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // while loading token, show overlay
  useEffect(() => {
    if (loading) return; // ainda verificando token

    // Se estiver logado, não permitir acesso a login/signup
    if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/(tabs)/home');
      return;
    }

    // Se não estiver logado e tentar acessar rotas protegidas
    const isProtected = pathname.startsWith('/(tabs)') || pathname === '/home' || pathname === '/';
    if (!isLoggedIn && isProtected) {
      showMessage({ message: 'Faça login para acessar esta página.', type: 'danger' });
      router.replace('/login');
    }
  }, [isLoggedIn, loading, pathname, router]);

  // while loading token, show overlay
  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <UserProvider>
  <Inner />
  <FlashMessage position="top" />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
