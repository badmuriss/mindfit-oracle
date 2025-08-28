import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { Button, TextInput } from 'react-native-paper';
import { useUser } from '../components/UserContext';

const { width: screenWidth } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const router = useRouter();
  const { setToken, setUserName, setUserEmail, setUserId } = useUser();

  const handleLogin = async () => {
    setLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password) {
      showMessage({
        message: 'Preencha todos os campos.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }
    if (!emailRegex.test(email)) {
      showMessage({
        message: 'Insira um email válido.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Enviando login para API...');
        const response = await fetch('https://mindfitapi.outis.com.br/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log('Resposta da API:', data);
      try {
        if (data && typeof data === 'object') {
          console.log('API response top-level keys:', Object.keys(data));
          if (data.user && typeof data.user === 'object') {
            console.log('API response data.user keys:', Object.keys(data.user));
          }
        } else {
          console.log('API response is not an object:', data);
        }
      } catch (e) {
        console.log('Error while logging API response keys:', e);
      }

      if (response.ok && data.token) {
        showMessage({
          message: 'Login realizado com sucesso!',
          type: 'success',
          icon: 'auto',
        });
  // Salva o token e nome no contexto e AsyncStorage
  setToken(data.token);
  // Try several possible fields for user name and email
  const possibleName = data.name || (data.user && data.user.name) || data.fullName || data.username || null;
  const possibleEmail = data.email || (data.user && data.user.email) || data.userEmail || null;
  if (possibleName) {
    console.log('Saving user name from login:', possibleName);
    setUserName(possibleName);
    await AsyncStorage.setItem('userName', possibleName);
  }
  if (possibleEmail) {
    console.log('Saving user email from login:', possibleEmail);
    setUserEmail(possibleEmail);
    await AsyncStorage.setItem('userEmail', possibleEmail);
  }

  // Save userId if available
  const possibleUserId = data.id || (data.user && data.user.id) || null;
  if (possibleUserId) {
    console.log('Saving userId from login:', possibleUserId);
    setUserId(possibleUserId);
    await AsyncStorage.setItem('userId', possibleUserId);
  }

  // If API didn't return name, try fetching user profile using returned id
  const userId = data.id || (data.user && data.user.id) || null;
  if (!possibleName && userId) {
    try {
      const profileResp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}`, {
        headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' },
      });
      if (profileResp.ok) {
        const profile = await profileResp.json();
        console.log('Fetched user profile after login:', profile);
        if (profile.name) {
          setUserName(profile.name);
          await AsyncStorage.setItem('userName', profile.name);
        }
        if (profile.email) {
          setUserEmail(profile.email);
          await AsyncStorage.setItem('userEmail', profile.email);
        }
      } else {
        console.log('Failed to fetch profile after login, status:', profileResp.status);
      }
    } catch (err) {
      console.log('Error fetching profile after login:', err);
    }
  }
  await AsyncStorage.setItem('userToken', data.token);
  if (data.name) await AsyncStorage.setItem('userName', data.name);
        // Aguarda 2 segundos para mostrar o alerta antes de navegar
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 2000);
      } else {
        showMessage({
          message: data.message || 'Usuário ou senha inválidos.',
          type: 'danger',
          icon: 'auto',
        });
      }
      setLoading(false);
    } catch (error) {
      console.log('Erro na requisição:', error);
      showMessage({
        message: 'Erro ao conectar à API.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <Image source={require('../assets/images/loading.gif')} style={{ width: 80, height: 80 }} />
        </View>
      )}
      <LinearGradient
        colors={["#14532d", "#22c55e", "#bbf7d0"]} // verde escuro para verde claro
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo_mindfit.png')}
          style={styles.logo}
          resizeMode="contain"
        />
  <Text style={styles.title}>Bem-vindo de volta</Text>
        <View style={styles.form}>
          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            theme={{ colors: { text: '#fff', placeholder: '#aaa', background: 'transparent' } }}
            onSubmitEditing={handleLogin}
          />
          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            theme={{ colors: { text: '#fff', placeholder: '#aaa', background: 'transparent' } }}
            onSubmitEditing={handleLogin}
          />
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}
            buttonColor="#22c55e"
          >
            Entrar
          </Button>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.forgot}>Esqueceu a senha?</Text>
        </TouchableOpacity>
        <View style={styles.bottomLinks}>
          <Text style={styles.bottomText}> Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.replace('/signup')}>
            <Text style={styles.signinLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
  {/* FlashMessage is now mounted globally in app/_layout.tsx */}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1333',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth <= 400 ? 20 : 24,
    zIndex: 1,
  },
  logo: {
  width: 120,
  height: 120,
    marginBottom: 32,
  },
  title: {
  color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  textAlign: 'center',
  alignSelf: 'center',
  },
  form: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
  backgroundColor: '#fff',
  borderRadius: 24,
  marginBottom: 16,
  color: '#111',
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  forgot: {
  color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 15,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomText: {
    color: '#14532d',
    fontSize: 15,
  },
  signinLink: {
  color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});