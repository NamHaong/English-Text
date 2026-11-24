import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VocabProvider } from '../context/VocabContext';
import { checkAndApplyUpdatesAuto } from '../services/updates';

export default function RootLayout() {
  useEffect(() => {
    checkAndApplyUpdatesAuto();
  }, []);

  return (
    <VocabProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </VocabProvider>
  );
}
