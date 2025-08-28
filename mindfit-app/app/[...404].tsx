import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      
      <View style={styles.content}>
        {/* Error icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="error-outline" size={120} color="#22c55e" />
        </View>

        {/* Logo */}
        <Image
          source={require('../assets/images/logo_mindfit.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Error code */}
        <Text style={styles.errorCode}>404</Text>
        
        {/* Title */}
        <Text style={styles.title}>Página não encontrada</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          A página que você está procurando não existe ou foi movida.
        </Text>
        
        {/* Route info */}
        <View style={styles.routeContainer}>
          <MaterialIcons name="link-off" size={16} color="#64748b" />
          <Text style={styles.routeText} numberOfLines={1}>
            {pathname}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <MaterialIcons name="home" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/login')}
          >
            <MaterialIcons name="arrow-back" size={20} color="#22c55e" />
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Verifique se a URL está correta ou entre em contato com o suporte.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
    opacity: 0.8,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.9,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: '900',
    color: '#22c55e',
    marginBottom: 16,
    textShadowColor: 'rgba(34, 197, 94, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  routeText: {
    color: '#64748b',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'monospace',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    marginTop: 32,
    color: '#64748b',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
});