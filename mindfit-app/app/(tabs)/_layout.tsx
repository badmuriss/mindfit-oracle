// app/(tabs)/_layout.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: Math.max(65 + insets.bottom, 65),
          paddingHorizontal: Math.max(width * 0.05, 16),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="exercise" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="assistant" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-excited" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="nutrition" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food-apple" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}