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
          paddingTop: 12,
          height: Math.max(80 + insets.bottom, 80),
          paddingHorizontal: 16,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={26} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="exercise" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dumbbell" size={26} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="assistant" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="robot-excited" size={26} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="nutrition" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="food-apple" size={26} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={26} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}