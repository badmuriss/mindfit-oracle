import { Stack, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';

import { UserProvider, useUser } from '../components/UserContext';

function AuthProtectedLayout() {
  const { isLoggedIn, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Aguarda o fim do carregamento
    }

    const isProtectedRoute = pathname.startsWith('/(tabs)');

    // Se logado, redireciona de /login ou /signup para a home
    if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/(tabs)/home');
    }
    // Se não logado, redireciona de rotas protegidas para /login
    else if (!isLoggedIn && isProtectedRoute) {
      showMessage({
        message: 'Faça login para acessar esta página.',
        type: 'danger',
      });
      router.replace('/login');
    }
  }, [isLoggedIn, loading, pathname, router]);

  // Exibe um indicador de carregamento enquanto verifica o token
  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Renderiza o conteúdo da rota atual
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="[...404]" options={{ title: "Página não encontrada" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <AuthProtectedLayout />
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