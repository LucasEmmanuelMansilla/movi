// app/_layout.tsx
import { Slot } from 'expo-router';
import { View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import linking from './linking';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar
          style="light"
          backgroundColor="#053959"
          translucent
        />

        <View
          style={{
            flex: 1,
            backgroundColor: 'black',
            paddingTop:
              Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
          }}
        >
          <Slot />
        </View>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export { linking };