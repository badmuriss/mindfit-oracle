
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { Button, TextInput } from 'react-native-paper';
import { useUser } from '../components/UserContext';

const { width: screenWidth } = Dimensions.get('window');


export default function SignupScreen() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Tipo de usuário fixo
  const router = useRouter();
  const { setToken, setUserName, setUserEmail, setUserId } = useUser();

  const handleSignup = async () => {
    setLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email || !password) {
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
      const response = await fetch('https://mindfitapi.outis.com.br/auth/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, userType: 'User' }),
      });
      const data = await response.json();
  console.log('Resposta da API (signup):', data);
      if (response.ok && data.token) {
        showMessage({
          message: 'Cadastro realizado com sucesso!',
          type: 'success',
          icon: 'auto',
        });
  // Salva o token e nome no contexto e AsyncStorage
  setToken(data.token);
        // prefer API name but fallback to the entered name
        const possibleName = data.name || (data.user && data.user.name) || data.fullName || name;
        const possibleEmail = data.email || (data.user && data.user.email) || data.userEmail || null;
        if (possibleName) {
          console.log('Saving user name from signup:', possibleName);
          setUserName(possibleName);
          await AsyncStorage.setItem('userName', possibleName);
        }
        if (possibleEmail) {
          console.log('Saving user email from signup:', possibleEmail);
          setUserEmail(possibleEmail);
          await AsyncStorage.setItem('userEmail', possibleEmail);
        }
        await AsyncStorage.setItem('userToken', data.token);

  const userId = data.id || (data.user && data.user.id) || null;
        if (!possibleName && userId) {
          try {
            const profileResp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}`, {
              headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' },
            });
            if (profileResp.ok) {
              const profile = await profileResp.json();
              console.log('Fetched user profile after signup:', profile);
              if (profile.name) {
                setUserName(profile.name);
                await AsyncStorage.setItem('userName', profile.name);
              }
              if (profile.email) {
                setUserEmail(profile.email);
                await AsyncStorage.setItem('userEmail', profile.email);
              }
            } else {
              console.log('Failed to fetch profile after signup, status:', profileResp.status);
            }
          } catch (err) {
            console.log('Error fetching profile after signup:', err);
          }
        }
        if (userId) {
          setUserId(userId);
          await AsyncStorage.setItem('userId', userId);
        }
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 2000);
      } else {
        showMessage({
          message: data.message || 'Erro ao cadastrar usuário.',
          type: 'danger',
          icon: 'auto',
        });
      }
      setLoading(false);
  } catch {
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
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo_mindfit.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Cadastro</Text>
        <View style={styles.form}>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            theme={{ colors: { text: '#111', placeholder: '#aaa', background: '#fff' } }}
            onSubmitEditing={handleSignup}
          />
          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            theme={{ colors: { text: '#111', placeholder: '#aaa', background: '#fff' } }}
            onSubmitEditing={handleSignup}
          />
          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            theme={{ colors: { text: '#111', placeholder: '#aaa', background: '#fff' } }}
            onSubmitEditing={handleSignup}
          />
          <Button
            mode="contained"
            onPress={handleSignup}
            style={styles.loginButton}
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}
            buttonColor="#22c55e"
          >
            Cadastrar
          </Button>
        </View>
        <View style={styles.bottomLinks}>
          <Text style={styles.bottomText}>Já tem uma conta?</Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.signinLink}>Entrar</Text>
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
  pickerContainer: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  picker: {
    height: 40,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
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
    marginLeft: 8,
  },
});