import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { showMessage } from 'react-native-flash-message';
import { useRouter } from 'expo-router';

interface UserContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  userName: string | null;
  setUserName: (name: string | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userNameState, setUserNameState] = useState<string | null>(null);
  const setUserName = (name: string | null) => {
    setUserNameState(name ? name.trim() : null);
  };
  const [userEmailState, setUserEmailState] = useState<string | null>(null);
  const setUserEmail = (email: string | null) => {
    setUserEmailState(email ? email.trim() : null);
  };
  const [userIdState, setUserIdState] = useState<string | null>(null);
  const setUserId = (id: string | null) => {
    setUserIdState(id ? id.trim() : null);
  };
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!token;

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedUserId = await AsyncStorage.getItem('userId');

      if (storedToken) setToken(storedToken);
      if (storedName) {
        setUserName(storedName);
      }
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
      if (storedUserId) {
        setUserId(storedUserId);
      }
      setLoading(false);
    };
    loadToken();
  }, []);

  const logout = async () => {
    try {
      console.log('Starting logout process...');

      // Limpar AsyncStorage
      await AsyncStorage.multiRemove(['userToken', 'userName', 'userEmail', 'userId']);

      // Limpar estado de forma síncrona
      setToken(null);
      setUserName(null);
      setUserEmail(null);
      setUserId(null);

      console.log('Logout completed successfully');
      showMessage({ message: 'Logout realizado.', type: 'success' });

      // Redirect to login
      router.replace('/login');

    } catch (error) {
      console.error('Erro durante logout:', error);
      // Mesmo com erro, limpar o estado local
      setToken(null);
      setUserName(null);
      setUserEmail(null);
      setUserId(null);
      showMessage({ message: 'Logout realizado (com avisos).', type: 'warning' });
      router.replace('/login');
    }
  };

  return (
  <UserContext.Provider value={{ token, setToken, userName: userNameState, setUserName, userEmail: userEmailState, setUserEmail, userId: userIdState, setUserId, isLoggedIn, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
