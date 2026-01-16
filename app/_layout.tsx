// app/_layout.tsx
import { Slot } from 'expo-router';
import { View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import CustomAlert from '../src/components/ui/CustomAlert';
import { useAlertStore } from '../src/store/useAlertStore';
import linking from './linking';

// Mantener el splash screen visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { visible, config, hideAlert } = useAlertStore();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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

        <CustomAlert 
          visible={visible} 
          config={config} 
          onClose={hideAlert} 
        />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export { linking };