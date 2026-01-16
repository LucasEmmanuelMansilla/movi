import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { usePushNotifications } from '../../src/features/push/usePushNotifications';

export default function AppLayout() {
  const { user, role, status } = useAuthStore();
  
  // Registrar push notifications cuando el usuario está autenticado
  usePushNotifications();

  // Si no hay usuario y no está cargando, redirigir al login
  if (status !== 'idle' && status !== 'loading' && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <Tabs screenOptions={{
        headerStyle: { backgroundColor: '#053959' },
        headerTintColor: '#F3F4F6',
        tabBarActiveTintColor: '#09c577',
        tabBarInactiveTintColor: '#8CA3AF',
        headerShown: true,
      }}>
        {/* Para driver: mostrar available, para business: mostrar publish */}
        {role === 'driver' ? (
          <Tabs.Screen 
            name="available" 
            options={{ 
              title: 'Disponibles', 
              headerShown: false,
              tabBarIcon: ({ color, size }) => (<Ionicons name="bicycle" color={color} size={size} />) 
            }} 
          />
        ) : (
          <Tabs.Screen 
            name="publish" 
            options={{ 
              title: 'Publicar', 
              tabBarIcon: ({ color, size }) => (<Ionicons name="add-circle" color={color} size={size} />) 
            }} 
          />
        )}
        
        {/* Pantallas comunes para ambos roles */}
        <Tabs.Screen 
          name="mine" 
          options={{ 
            title: 'Mis envíos', 
            tabBarIcon: ({ color, size }) => (<Ionicons name="list" color={color} size={size} />) 
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Perfil', 
            tabBarIcon: ({ color, size }) => (<Ionicons name="person-circle" color={color} size={size} />) 
          }} 
        />
        
        {/* Ocultar la pantalla que no corresponde al rol */}
        {role === 'driver' ? (
          <Tabs.Screen 
            name="publish" 
            options={{ 
              href: null, // Ocultar de la barra de pestañas
              title: 'Publicar'
            }} 
          />
        ) : (
          <Tabs.Screen 
            name="available" 
            options={{ 
              href: null, // Ocultar de la barra de pestañas
              title: 'Disponibles'
            }} 
          />
        )}
        
        <Tabs.Screen
          name="shipment/[id]"
          options={{
            href: null, // Esta ruta no se muestra en la barra de pestañas
            title: 'Envío',
            tabBarIcon: () => null 
          }}
        />
        
        {/* Ocultar pantallas de pagos de la barra de pestañas */}
        <Tabs.Screen
          name="payments/success"
          options={{
            href: null,
            title: 'Pago exitoso',
            tabBarIcon: () => null
          }}
        />
        <Tabs.Screen
          name="payments/pending"
          options={{
            href: null,
            title: 'Pago pendiente',
            tabBarIcon: () => null
          }}
        />
        <Tabs.Screen
          name="payments/failure"
          options={{
            href: null,
            title: 'Pago fallido',
            tabBarIcon: () => null
          }}
        />
        <Tabs.Screen
          name="chat/[shipmentId]"
          options={{
            href: null,
            title: 'Chat',
            tabBarIcon: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            href: null,
            title: 'Billetera',
            tabBarIcon: () => null
          }}
        />
        <Tabs.Screen
          name="admin-transfers"
          options={{
            href: null,
            title: 'Gestión de Pagos',
            tabBarIcon: () => null
          }}
        />
      </Tabs>
    </View>
  );
}
