import { Stack } from 'expo-router';
import React from 'react';
import { UserProvider } from '../components/UserContext';

export default function App() {
  return (
    <UserProvider>
      <Stack />
    </UserProvider>
  );
}
