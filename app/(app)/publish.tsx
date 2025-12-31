import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { FormField } from '../../src/components/shipments/FormField';
import { ImagePickerSection } from '../../src/components/shipments/ImagePickerSection';
import { ShipmentFormHeader } from '../../src/components/shipments/ShipmentFormHeader';
import { MapPickerModal } from '../../src/components/shipments/MapPickerModal';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { useShipmentForm } from '../../src/hooks/useShipmentForm';
import { useLocationPicker } from '../../src/hooks/useLocationPicker';
import { isValidAddress } from '../../src/utils/validation';
import CustomAlert from '../../src/components/ui/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPayment } from '../../src/features/payments/service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { getErrorMessage } from '../../src/utils/errorHandler';
import { colors } from '../../src/ui/theme';

export default function PublishScreen() {
  const alertRef = useRef<any>(null);
  const imagePicker = useImagePicker();
  const locationPicker = useLocationPicker();
  const { user } = useAuthStore();
  const [processingPayment, setProcessingPayment] = useState(false);
  type GeoPoint = { latitude: number; longitude: number };
  const [mapVisible, setMapVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapInitialCoords, setMapInitialCoords] = useState<GeoPoint>({
    latitude: -34.6037,
    longitude: -58.3816,
  });
  const [pickupCoords, setPickupCoords] = useState<GeoPoint | null>(null);

  const formatAddress = (geocode?: Location.LocationGeocodedAddress) => {
    if (!geocode) return '';
    const parts = [
      geocode.streetNumber,
      geocode.street,
      geocode.city || geocode.district,
      geocode.region,
      geocode.postalCode,
      geocode.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const {
    formData,
    errors,
    loading,
    updateField,
    submitForm,
    setFormData,
  } = useShipmentForm();

  const showAlert = (title: string, message: string) => {
    if (alertRef.current) {
      alertRef.current.show({
        title,
        message,
        buttons: [{ text: 'Aceptar' }],
      });
    }
  };

  // Sincronizar imágenes del picker con el formulario
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, images: imagePicker.images }));
  }, [imagePicker.images, setFormData]);

  const handleImageAdd = async (source: 'camera' | 'gallery') => {
    await imagePicker.pickImage(source);
  };

  const handleImageRemove = (index: number) => {
    imagePicker.removeImage(index);
  };

  const handleSelectAddress = async (type: 'pickup' | 'dropoff') => {
    setMapTarget(type);
    // Abrir el mapa inmediatamente sin esperar la ubicación
    setMapVisible(true);
    
    // Intentar obtener la ubicación actual en segundo plano para centrar el mapa
    // NO usar pickFromCurrentPosition porque pone requesting=true y deshabilita botones
    // En su lugar, obtener la ubicación directamente sin afectar el estado del hook
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (current?.coords) {
            setMapInitialCoords({
              latitude: current.coords.latitude,
              longitude: current.coords.longitude,
            });
          }
        }
      } catch {
        // Si falla, simplemente usar las coordenadas por defecto
        // El mapa ya está abierto, no hay problema
      }
    })();
  };

  const handleSubmit = async () => {
    const result = await submitForm();
    if (result.success) {
      imagePicker.clearImages();
      // Guardar el envío creado en AsyncStorage para auto-refresh en mine.tsx
      if (result.shipment) {
        try {
          const pendingShipments = await AsyncStorage.getItem('pending_shipments');
          const shipments = pendingShipments ? JSON.parse(pendingShipments) : [];
          shipments.push(result.shipment);
          await AsyncStorage.setItem('pending_shipments', JSON.stringify(shipments));
        } catch (error) {
          console.warn('Error guardando envío pendiente:', error);
        }
        
        // Crear pago automáticamente y abrir checkout de Mercado Pago
        if (!user?.email) {
          Alert.alert('Error', 'No se encontró tu correo electrónico. Por favor inicia sesión nuevamente.');
          return;
        }

        try {
          setProcessingPayment(true);
          
          const paymentResponse = await createPayment({
            shipmentId: result.shipment.id,
            payerEmail: user.email,
            payerName: user.fullName || undefined,
          });

          // Abrir directamente el checkout de Mercado Pago
          const checkoutUrl = paymentResponse.checkoutUrl || paymentResponse.sandboxInitPoint || paymentResponse.initPoint;
          
          if (!checkoutUrl) {
            throw new Error('No se recibió URL de checkout');
          }

          // Abrir en un WebView dentro de la app
          // El usuario será redirigido automáticamente cuando complete o cancele el pago
          // Los deep links manejarán la navegación de regreso
          await openBrowserAsync(checkoutUrl, {
            presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
            enableBarCollapsing: false,
            controlsColor: colors.accent,
          });
          
          // Si el usuario cierra el browser sin completar el pago, 
          // puede navegar manualmente al detalle del envío desde "Mis envíos"
          // Si completa el pago, los deep links lo redirigirán automáticamente
        } catch (error: any) {
          const errorMessage = getErrorMessage(error);
          Alert.alert('Error al crear el pago', errorMessage);
        } finally {
          setProcessingPayment(false);
        }
      }
    } else {
      if (result.title && result.message) {
        showAlert(result.title, result.message);
      }
    }
  };

  // Estado para controlar el cálculo de precio
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const calculationTimeoutRef = React.useRef<number | null>(null);

  // Calcular precio automáticamente cuando cambian las direcciones o el peso
  React.useEffect(() => {
    // Limpiar timeout anterior si existe
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    const calculatePrice = async () => {
      // Validar que tenemos todos los datos necesarios
      if (!formData.pickup || !formData.dropoff || !formData.weight || !pickupCoords) {
        return;
      }

      // Si ya tenemos las coordenadas de dropoff del mapa, usarlas directamente
      let dropoffCoords: { latitude: number; longitude: number } | null = null;

      if (formData.dropoffLocation?.coords) {
        // Ya tenemos coordenadas del mapa, usarlas directamente
        dropoffCoords = {
          latitude: formData.dropoffLocation.coords.latitude,
          longitude: formData.dropoffLocation.coords.longitude,
        };
      } else {
        // Solo geocodificar si no tenemos coordenadas del mapa
        try {
          setCalculatingPrice(true);
          const [dropoffGeocode] = await Location.geocodeAsync(formData.dropoff);
          if (!dropoffGeocode) {
            setCalculatingPrice(false);
            return;
          }
          dropoffCoords = {
            latitude: dropoffGeocode.latitude,
            longitude: dropoffGeocode.longitude,
          };
        } catch (error) {
          console.warn('Error geocodificando dirección de entrega:', error);
          setCalculatingPrice(false);
          return;
        }
      }

      if (!dropoffCoords) {
        setCalculatingPrice(false);
        return;
      }

      try {
        // Calcular distancia
        const distance = haversine(
          pickupCoords.latitude,
          pickupCoords.longitude,
          dropoffCoords.latitude,
          dropoffCoords.longitude
        );

        // Calcular precio: base por km + factor por peso
        // Fórmula: (distancia_km * precio_por_km) + (peso_kg * factor_peso)
        const PRICE_PER_KM = 500; // $500 por kilómetro
        const PRICE_PER_KG = 200; // $200 por kilogramo
        const BASE_PRICE = 1000; // Precio base

        const calculatedPrice = BASE_PRICE + (distance * PRICE_PER_KM) + (Number(formData.weight) * PRICE_PER_KG);
        
        updateField('price', Math.round(calculatedPrice).toString());
      } catch (error) {
        console.warn('Error calculando precio:', error);
      } finally {
        setCalculatingPrice(false);
      }
    };

    // Debounce: esperar 500ms antes de calcular para evitar cálculos múltiples
    calculationTimeoutRef.current = setTimeout(() => {
      calculatePrice();
    }, 500);

    // Cleanup
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [formData.pickup, formData.dropoff, formData.weight, formData.dropoffLocation, pickupCoords]);

  // Verificar si el formulario tiene todos los campos requeridos completos
  const isFormValid = React.useMemo(() => {
    const titleValid = formData.title.trim().length >= 3;
    const weightValid = Number(formData.weight) > 0;
    const priceValid = Number(formData.price) > 0;
    const pickupValid = isValidAddress(formData.pickup);
    const dropoffValid = isValidAddress(formData.dropoff);
    return titleValid && weightValid && priceValid && pickupValid && dropoffValid;
  }, [formData.title, formData.weight, formData.price, formData.pickup, formData.dropoff]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ShipmentFormHeader />

      <ImagePickerSection
        images={formData.images}
        onImageAdd={handleImageAdd}
        onImageRemove={handleImageRemove}
        maxImages={imagePicker.maxImages}
      />

      <FormField
        label="Título"
        required
        placeholder="Ej: Envío de documentos urgentes"
        value={formData.title}
        onChangeText={(text) => updateField('title', text)}
        error={errors.title}
        editable={!loading}
      />

      <FormField
        label="Descripción"
        hint="Opcional"
        placeholder="Describe el pedido, dimensiones, peso, etc."
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        multiline
        numberOfLines={4}
        editable={!loading}
      />

      <View style={styles.locationContainer}>
        <FormField
          label="Dirección de retiro"
          required
          placeholder="Calle, número, ciudad"
          value={formData.pickup}
          onChangeText={(text) => updateField('pickup', text)}
          error={errors.pickup}
          editable={false}
        />
        <TouchableOpacity
          style={[styles.mapButton, loading && styles.buttonDisabled]}
          onPress={() => handleSelectAddress('pickup')}
          disabled={loading}
        >
          <Ionicons name="location-outline" size={18} color="#053959" />
          <Text style={styles.mapButtonText}>
            Buscar en el mapa
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationContainer}>
        <FormField
          label="Dirección de entrega"
          required
          placeholder="Calle, número, ciudad"
          value={formData.dropoff}
          onChangeText={(text) => updateField('dropoff', text)}
          error={errors.dropoff}
          editable={false}
        />
        <TouchableOpacity
          style={[styles.mapButton, loading && styles.buttonDisabled]}
          onPress={() => handleSelectAddress('dropoff')}
          disabled={loading}
        >
          <Ionicons name="location-outline" size={18} color="#053959" />
          <Text style={styles.mapButtonText}>
            Buscar en el mapa
          </Text>
        </TouchableOpacity>
      </View>

      <FormField
        label="Peso (en kg)"
        required
        placeholder="Ej: 5.5"
        value={formData.weight}
        onChangeText={(text) => updateField('weight', text.replace(/[^0-9.]/g, ''))}
        error={errors.weight}
        keyboardType="decimal-pad"
        editable={!loading}
      />

      <View style={styles.priceDisplayContainer}>
        <Text style={styles.priceLabel}>Precio calculado</Text>
        <Text style={styles.priceValue}>
          {calculatingPrice ? 'Calculando...' : formData.price ? `$${Number(formData.price).toLocaleString('es-AR')}` : '-'}
        </Text>
        <Text style={styles.priceHint}>
          Basado en distancia y peso del envío
        </Text>
      </View>


      {locationPicker.error && (
        <Text style={styles.inlineError}>{locationPicker.error}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, (loading || processingPayment || !isFormValid) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || processingPayment || !isFormValid}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Publicando...' : processingPayment ? 'Preparando pago...' : 'Publicar envío'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer} />
      <CustomAlert ref={alertRef} />
      <MapPickerModal
        visible={mapVisible}
        initialCoords={mapInitialCoords}
        onClose={() => setMapVisible(false)}
        title={mapTarget === 'pickup' ? 'Selecciona punto de retiro' : 'Selecciona punto de entrega'}
        onConfirm={async (coords) => {
          // Evitar que retiro y entrega queden en el mismo punto
          if (mapTarget === 'dropoff' && pickupCoords) {
            const dist = haversine(
              pickupCoords.latitude,
              pickupCoords.longitude,
              coords.latitude,
              coords.longitude
            );
            if (dist < 0.05) { // 50 metros
              showAlert('Puntos muy cercanos', 'Mueve el pin de entrega para que sea distinto al retiro.');
              return;
            }
          }

          // Cerrar el mapa inmediatamente para mejorar la experiencia
          setMapVisible(false);

          // Actualizar coordenadas primero (esto es instantáneo)
          if (mapTarget === 'pickup') {
            setPickupCoords(coords);
            setFormData(prev => ({
              ...prev,
              location: {
                coords: {
                  accuracy: 0,
                  altitude: 0,
                  altitudeAccuracy: 0,
                  heading: 0,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  speed: 0,
                },
                mocked: false,
                timestamp: Date.now(),
              },
            }));
            // Mostrar coordenadas temporalmente mientras se geocodifica
            updateField('pickup', `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
            
            // Geocodificar en segundo plano (no bloquea la UI)
            Location.reverseGeocodeAsync(coords).then(([geocode]) => {
              if (geocode) {
                const formatted = formatAddress(geocode) || 'Ubicación seleccionada';
                updateField('pickup', formatted);
              }
            }).catch(() => {
              // Si falla la geocodificación, mantener las coordenadas
              console.warn('Error geocodificando dirección de retiro');
            });
          } else {
            // Guardar coordenadas de entrega inmediatamente
            setFormData(prev => ({
              ...prev,
              dropoffLocation: {
                coords: {
                  accuracy: 0,
                  altitude: 0,
                  altitudeAccuracy: 0,
                  heading: 0,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  speed: 0,
                },
                mocked: false,
                timestamp: Date.now(),
              },
            }));
            // Mostrar coordenadas temporalmente mientras se geocodifica
            updateField('dropoff', `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
            
            // Calcular precio inmediatamente con las coordenadas del mapa (sin esperar geocodificación)
            if (pickupCoords && formData.weight) {
              const distance = haversine(
                pickupCoords.latitude,
                pickupCoords.longitude,
                coords.latitude,
                coords.longitude
              );
              const PRICE_PER_KM = 500;
              const PRICE_PER_KG = 200;
              const BASE_PRICE = 1000;
              const calculatedPrice = BASE_PRICE + (distance * PRICE_PER_KM) + (Number(formData.weight) * PRICE_PER_KG);
              updateField('price', Math.round(calculatedPrice).toString());
            }
            
            // Geocodificar en segundo plano (no bloquea la UI)
            Location.reverseGeocodeAsync(coords).then(([geocode]) => {
              if (geocode) {
                const formatted = formatAddress(geocode) || 'Ubicación seleccionada';
                updateField('dropoff', formatted);
              }
            }).catch(() => {
              // Si falla la geocodificación, mantener las coordenadas
              console.warn('Error geocodificando dirección de entrega');
            });
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3F4F6',
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#09c577',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#09c577',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  locationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    height: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F6EE',
    borderColor: '#09c577',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 10,
    justifyContent: 'center',
  },
  mapButtonText: {
    color: '#053959',
    fontWeight: '600',
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  locationTitle: {
    color: '#053959',
    fontWeight: '700',
    marginBottom: 6,
  },
  locationText: {
    color: '#111827',
    marginBottom: 2,
  },
  locationHint: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  inlineError: {
    marginHorizontal: 16,
    marginTop: 6,
    color: '#b91c1c',
  },
  priceDisplayContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#E5F6EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#09c577',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#053959',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09c577',
    marginBottom: 4,
  },
  priceHint: {
    fontSize: 12,
    color: '#6B7280',
  },
});
