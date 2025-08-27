import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo_mindfit.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Ops — Página não encontrada</Text>
      <Text style={styles.subtitle}>{`A rota “${pathname}” não existe ou foi removida.`}</Text>
      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => router.replace('/' as any)}
          style={styles.button}
          buttonColor="#22c55e"
        >
          Ir para a tela inicial
        </Button>
        <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
          Voltar
        </Button>
      </View>
      <Text style={styles.footer}>Se você digitou a URL manualmente, verifique se não há erros de digitação.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 140,
    height: 140,
    marginBottom: 24,
    opacity: 0.9,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    marginHorizontal: 6,
  },
  footer: {
    marginTop: 18,
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 13,
  },
});

