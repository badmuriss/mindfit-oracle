
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { Button, TextInput, Menu } from 'react-native-paper';
import { useUser } from '../components/UserContext';
import { API_ENDPOINTS } from '../constants/Api';

const { width: screenWidth } = Dimensions.get('window');


export default function SignupScreen() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sex, setSex] = useState('');
  const [birthDate, setBirthDate] = useState(''); // String format DD/MM/YYYY
  const [weight, setWeight] = useState(''); // Weight in kg
  const [height, setHeight] = useState(''); // Height in cm
  const [observations, setObservations] = useState(''); // Optional observations for AI profile
  const [showSexMenu, setShowSexMenu] = useState(false);

  // Date mask function
  const formatDateInput = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Apply DD/MM/YYYY mask
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    setBirthDate(formatted);
  };
  // Tipo de usuário fixo
  const router = useRouter();
  const { setToken, setUserName, setUserEmail, setUserId } = useUser();

  const handleSignup = async () => {
    setLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email || !password || !sex || !birthDate.trim() || !weight.trim() || !height.trim()) {
      showMessage({
        message: 'Preencha todos os campos obrigatórios.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }
    
    // Validate weight (20-500 kg)
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue < 20 || weightValue > 500) {
      showMessage({
        message: 'Peso deve estar entre 20 e 500 kg.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }
    
    // Validate height (50-250 cm)
    const heightValue = parseFloat(height);
    if (isNaN(heightValue) || heightValue < 50 || heightValue > 250) {
      showMessage({
        message: 'Altura deve estar entre 50 e 250 cm.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }
    
    // Parse and validate birth date
    const dateMatch = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!dateMatch) {
      showMessage({
        message: 'Data de nascimento deve estar no formato DD/MM/AAAA.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }
    
    const [, day, month, year] = dateMatch;
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate date is real (e.g., not 31/02/2000)
    if (parsedDate.getDate() !== parseInt(day) || 
        parsedDate.getMonth() !== parseInt(month) - 1 || 
        parsedDate.getFullYear() !== parseInt(year)) {
      showMessage({
        message: 'Data de nascimento inválida.',
        type: 'danger',
        icon: 'auto',
      });
      setLoading(false);
      return;
    }
    
    // Validate age (13-120 years)
    const today = new Date();
    const age = today.getFullYear() - parsedDate.getFullYear();
    const monthDiff = today.getMonth() - parsedDate.getMonth();
    const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate()) ? age - 1 : age;
    
    if (finalAge < 13 || finalAge > 120) {
      showMessage({
        message: 'A idade deve estar entre 13 e 120 anos.',
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
      const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          userType: 'User',
          sex,
          birthDate: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, // UTC format YYYY-MM-DD
          initialWeightInKG: weightValue,
          initialHeightInCM: heightValue,
          observations: observations.trim() || null
        }),
      });
      const data = await response.json();
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
          setUserName(possibleName);
          await AsyncStorage.setItem('userName', possibleName);
        }
        if (possibleEmail) {
          setUserEmail(possibleEmail);
          await AsyncStorage.setItem('userEmail', possibleEmail);
        }
        await AsyncStorage.setItem('userToken', data.token);

  const userId = data.id || (data.user && data.user.id) || null;
        if (!possibleName && userId) {
          try {
            const profileResp = await fetch(API_ENDPOINTS.USERS.PROFILE(userId), {
              headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' },
            });
            if (profileResp.ok) {
              const profile = await profileResp.json();
              if (profile.name) {
                setUserName(profile.name);
                await AsyncStorage.setItem('userName', profile.name);
              }
              if (profile.email) {
                setUserEmail(profile.email);
                await AsyncStorage.setItem('userEmail', profile.email);
              }
            }
          } catch (err) {
            // Silent error handling for profile fetch
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
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.form}>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
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
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
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
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
            onSubmitEditing={handleSignup}
          />
          
          {/* Sex Dropdown */}
          <View style={styles.dropdownContainer}>
            <Menu
              visible={showSexMenu}
              onDismiss={() => setShowSexMenu(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowSexMenu(true)}
                >
                  <Text style={[styles.dropdownText, !sex && styles.placeholderText]}>
                    {sex ? (sex === 'MALE' ? 'Masculino' : sex === 'FEMALE' ? 'Feminino' : 'Prefiro não informar') : 'Selecione o sexo'}
                  </Text>
                </TouchableOpacity>
              }
            >
              <Menu.Item onPress={() => { setSex('MALE'); setShowSexMenu(false); }} title="Masculino" />
              <Menu.Item onPress={() => { setSex('FEMALE'); setShowSexMenu(false); }} title="Feminino" />
              <Menu.Item onPress={() => { setSex('NOT_INFORMED'); setShowSexMenu(false); }} title="Prefiro não informar" />
            </Menu>
          </View>

          {/* Birth Date Input */}
          <TextInput
            label="Data de Nascimento"
            value={birthDate}
            onChangeText={handleDateChange}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
            onSubmitEditing={handleSignup}
          />
          
          {/* Weight Input */}
          <TextInput
            label="Peso (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="Ex: 70.5"
            keyboardType="numeric"
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
            onSubmitEditing={handleSignup}
          />
          
          {/* Height Input */}
          <TextInput
            label="Altura (cm)"
            value={height}
            onChangeText={setHeight}
            placeholder="Ex: 175"
            keyboardType="numeric"
            style={styles.input}
            underlineColor="transparent"
            mode="flat"
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
            onSubmitEditing={handleSignup}
          />
          
          {/* Observations Input */}
          <TextInput
            label="Observações (opcional)"
            value={observations}
            onChangeText={setObservations}
            placeholder="Conte-nos sobre seus objetivos, preferências alimentares, restrições, etc."
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            underlineColor="transparent"
            mode="flat"
            textColor="#0f172a"
            contentStyle={{ color: '#0f172a' }}
            placeholderTextColor="#475569"
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
        </ScrollView>
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
    paddingHorizontal: screenWidth <= 440 ? 20 : 24,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: screenWidth <= 440 ? 28 : 32,
    fontWeight: 'bold',
    marginBottom: screenWidth <= 440 ? 24 : 32,
    textAlign: 'center',
    alignSelf: 'center',
  },
  scrollContainer: {
    width: '100%',
    maxHeight: 500,
  },
  form: {
    width: '100%',
    marginBottom: 24,
    paddingBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    color: '#0f172a',
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
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  dropdownText: {
    fontSize: 16,
    color: '#0f172a',
  },
  placeholderText: {
    color: '#475569',
  },
  textArea: {
    minHeight: 80,
  },
  datePickerText: {
    fontSize: 16,
    color: '#111',
  },
  datePickerLabel: {
    fontWeight: '500',
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
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomText: {
    color: '#22c55e',
    fontSize: screenWidth <= 440 ? 14 : 15,
    fontWeight: '500',
  },
  signinLink: {
    color: '#fff',
    fontSize: screenWidth <= 440 ? 14 : 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});