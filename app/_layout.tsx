// app/_layout.tsx
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import linking from './linking';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" backgroundColor="#053959" /> 
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <Slot />
        </View>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export { linking };