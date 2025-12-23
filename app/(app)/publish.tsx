import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { FormField } from '../../src/components/shipments/FormField';
import { ImagePickerSection } from '../../src/components/shipments/ImagePickerSection';
import { PriceInput } from '../../src/components/shipments/PriceInput';
import { ShipmentFormHeader } from '../../src/components/shipments/ShipmentFormHeader';
import { MapPickerModal } from '../../src/components/shipments/MapPickerModal';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { useShipmentForm } from '../../src/hooks/useShipmentForm';
import { useLocationPicker } from '../../src/hooks/useLocationPicker';
import { isValidAddress } from '../../src/utils/validation';
import CustomAlert from '../../src/components/ui/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PublishScreen() {
  const alertRef = useRef<any>(null);
  const imagePicker = useImagePicker();
  const locationPicker = useLocationPicker();
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
    const result = await locationPicker.pickFromCurrentPosition();
    if (result?.location?.coords) {
      setMapInitialCoords({
        latitude: result.location.coords.latitude,
        longitude: result.location.coords.longitude,
      });
    }
    setMapVisible(true);
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
      }
      if (result.title && result.message) {
        showAlert(result.title, result.message);
      }
    } else {
      if (result.title && result.message) {
        showAlert(result.title, result.message);
      }
    }
  };

  // Verificar si el formulario tiene todos los campos requeridos completos
  const isFormValid = React.useMemo(() => {
    const titleValid = formData.title.trim().length >= 3;
    const priceValid = Number(formData.price) > 0;
    const pickupValid = isValidAddress(formData.pickup);
    const dropoffValid = isValidAddress(formData.dropoff);
    return titleValid && priceValid && pickupValid && dropoffValid;
  }, [formData.title, formData.price, formData.pickup, formData.dropoff]);

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
          style={[styles.mapButton, (loading || locationPicker.requesting) && styles.buttonDisabled]}
          onPress={() => handleSelectAddress('pickup')}
          disabled={loading || locationPicker.requesting}
        >
          <Ionicons name="location-outline" size={18} color="#053959" />
          <Text style={styles.mapButtonText}>
            {locationPicker.requesting ? 'Obteniendo ubicación...' : 'Buscar en el mapa'}
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
          style={[styles.mapButton, (loading || locationPicker.requesting) && styles.buttonDisabled]}
          onPress={() => handleSelectAddress('dropoff')}
          disabled={loading || locationPicker.requesting}
        >
          <Ionicons name="location-outline" size={18} color="#053959" />
          <Text style={styles.mapButtonText}>
            {locationPicker.requesting ? 'Obteniendo ubicación...' : 'Buscar en el mapa'}
          </Text>
        </TouchableOpacity>
      </View>
      <PriceInput
        label="Precio (en pesos)"
        value={formData.price}
        onChangeText={(text) => updateField('price', text)}
        error={errors.price}
        editable={!loading}
      />


      {locationPicker.error && (
        <Text style={styles.inlineError}>{locationPicker.error}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, (loading || !isFormValid) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !isFormValid}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Publicando...' : 'Publicar envío'}
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

          // Geocodificar para obtener una dirección legible
          try {
            const [geocode] = await Location.reverseGeocodeAsync(coords);
            const formatted = formatAddress(geocode) || 'Ubicación seleccionada';

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
              updateField('pickup', formatted);
            } else {
              updateField('dropoff', formatted);
            }

            setMapVisible(false);
          } catch {
            showAlert('Error', 'No se pudo obtener la dirección del punto seleccionado.');
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
});
