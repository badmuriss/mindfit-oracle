import { Stack, usePathname, useRouter } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';

import { UserProvider, useUser } from '../components/UserContext';

function AuthProtectedLayout() {
  const { isLoggedIn, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Configurar fullscreen para mobile
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Configurar para fullscreen no Android - mais agressivo
      SystemUI.setBackgroundColorAsync('transparent');
      
      // Esconder completamente a barra de navegação
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync('transparent');
      
      // Força a UI do sistema a ficar escondida
      const hideSystemUI = () => {
        SystemUI.setBackgroundColorAsync('transparent');
        NavigationBar.setVisibilityAsync('hidden');
      };
      
      // Esconde a UI imediatamente e quando a tela ganha foco
      hideSystemUI();
      
      // Re-esconde quando o usuário toca na tela (caso apareça)
      const interval = setInterval(hideSystemUI, 3000);
      
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return; // Aguarda o fim do carregamento
    }

    console.log('Auth check - isLoggedIn:', isLoggedIn, 'pathname:', pathname);

    const isProtectedRoute = pathname.startsWith('/(tabs)');

    // Se logado, redireciona de /login ou /signup para a home
    if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
      console.log('Redirecting logged user to home');
      router.replace('/(tabs)/home');
    }
    // Se não logado, redireciona de rotas protegidas para /login
    else if (!isLoggedIn && isProtectedRoute) {
      console.log('Redirecting unauthenticated user to login');
      showMessage({
        message: 'Faça login para acessar esta página.',
        type: 'danger',
      });
      router.replace('/login');
    }
    // Se não logado e na raiz, vai para login
    else if (!isLoggedIn && pathname === '/') {
      console.log('Redirecting from root to login');
      router.replace('/login');
    }
  }, [isLoggedIn, loading, pathname, router]);

  // Effect adicional para monitorar mudanças no estado de login
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      console.log('User logged out, forcing redirect to login');
      router.replace('/login');
    }
  }, [isLoggedIn, loading, router]);

  // Exibe um indicador de carregamento enquanto verifica o token
  if (loading) {
    return (
      <>
        <StatusBar style="light" backgroundColor="transparent" translucent={true} hidden={Platform.OS === 'android'} />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </>
    );
  }

  // Renderiza o conteúdo da rota atual
  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} hidden={Platform.OS === 'android'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="[...404]" options={{ title: "Página não encontrada" }} />
      </Stack>
    </>
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