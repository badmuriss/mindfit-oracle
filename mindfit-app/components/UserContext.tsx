import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { showMessage } from 'react-native-flash-message';

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
        console.log('Loaded userName from storage:', storedName);
        setUserName(storedName);
      }
      if (storedEmail) {
        console.log('Loaded userEmail from storage:', storedEmail);
        setUserEmail(storedEmail);
      }
      if (storedUserId) {
        console.log('Loaded userId from storage:', storedUserId);
        setUserId(storedUserId);
      }
  setLoading(false);
    };
    loadToken();
  console.log('UserProvider mounted');
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userId');
    setToken(null);
    setUserName(null);
    setUserEmail(null);
    setUserId(null);
  showMessage({ message: 'Logout realizado.', type: 'success' });
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
