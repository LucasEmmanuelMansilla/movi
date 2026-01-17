import { useRef, useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useImagePicker } from '../useImagePicker';
import { useShipmentForm } from '../useShipmentForm';
import { createPayment } from '../../features/payments/service';
import { useAuthStore } from '../../store/useAuthStore';
import { getErrorMessage } from '../../utils/errorHandler';
import { isValidAddress } from '../../utils/validation';
import { haversine, formatAddress, GeoPoint } from '../../utils/geolocation';
import { colors } from '../../ui/theme';

export function usePublishScreenLogic() {
  const alertRef = useRef<any>(null);
  const imagePicker = useImagePicker();
  const { user } = useAuthStore();
  
  const [processingPayment, setProcessingPayment] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapInitialCoords, setMapInitialCoords] = useState<GeoPoint>({
    latitude: -34.6037,
    longitude: -58.3816,
  });

  // Intentar obtener la ubicación actual lo más rápido posible al montar el componente
  useEffect(() => {
    const fetchQuickLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          // Primero intentamos la última posición conocida (es instantánea)
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown?.coords) {
            setMapInitialCoords({
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            });
          }
          
          // Luego actualizamos con la posición actual precisa
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
      } catch (error) {
        console.warn('Error obteniendo ubicación inicial:', error);
      }
    };

    fetchQuickLocation();
  }, []);

  const [pickupCoords, setPickupCoords] = useState<GeoPoint | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useShipmentForm();
  const { formData, updateField, submitForm, setFormData } = form;

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
  useEffect(() => {
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
    setMapVisible(true);
    
    // Si la ubicación es la por defecto, intentamos una actualización rápida
    if (mapInitialCoords.latitude === -34.6037 && mapInitialCoords.longitude === -58.3816) {
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          setMapInitialCoords({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }
      } catch {
        // Ignorar
      }
    }
  };

  const handleConfirmLocation = async (coords: GeoPoint) => {
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

    setMapVisible(false);

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
      updateField('pickup', `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      
      Location.reverseGeocodeAsync(coords).then(([geocode]) => {
        if (geocode) {
          updateField('pickup', formatAddress(geocode) || 'Ubicación seleccionada');
        }
      }).catch(() => console.warn('Error geocodificando retiro'));
    } else {
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
      updateField('dropoff', `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      
      // Calcular precio inmediato
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
      
      Location.reverseGeocodeAsync(coords).then(([geocode]) => {
        if (geocode) {
          updateField('dropoff', formatAddress(geocode) || 'Ubicación seleccionada');
        }
      }).catch(() => console.warn('Error geocodificando entrega'));
    }
  };

  // Calcular precio automáticamente
  useEffect(() => {
    if (calculationTimeoutRef.current) clearTimeout(calculationTimeoutRef.current);

    const calculatePrice = async () => {
      if (!formData.pickup || !formData.dropoff || !formData.weight || !pickupCoords) return;

      let dropoffCoords: GeoPoint | null = null;

      if (formData.dropoffLocation?.coords) {
        dropoffCoords = {
          latitude: formData.dropoffLocation.coords.latitude,
          longitude: formData.dropoffLocation.coords.longitude,
        };
      } else {
        try {
          setCalculatingPrice(true);
          const [dropoffGeocode] = await Location.geocodeAsync(formData.dropoff);
          if (dropoffGeocode) {
            dropoffCoords = { latitude: dropoffGeocode.latitude, longitude: dropoffGeocode.longitude };
          }
        } catch (error) {
          console.warn('Error geocodificando entrega:', error);
        }
      }

      if (dropoffCoords) {
        const distance = haversine(
          pickupCoords.latitude,
          pickupCoords.longitude,
          dropoffCoords.latitude,
          dropoffCoords.longitude
        );
        const PRICE_PER_KM = 500;
        const PRICE_PER_KG = 200;
        const BASE_PRICE = 1000;
        const calculatedPrice = BASE_PRICE + (distance * PRICE_PER_KM) + (Number(formData.weight) * PRICE_PER_KG);
        updateField('price', Math.round(calculatedPrice).toString());
      }
      setCalculatingPrice(false);
    };

    calculationTimeoutRef.current = setTimeout(calculatePrice, 500);
    return () => { if (calculationTimeoutRef.current) clearTimeout(calculationTimeoutRef.current); };
  }, [formData.pickup, formData.dropoff, formData.weight, formData.dropoffLocation, pickupCoords, updateField]);

  const handleSubmit = async () => {
    const result = await submitForm();
    if (result.success && result.shipment) {
      imagePicker.clearImages();
      try {
        const pendingShipments = await AsyncStorage.getItem('pending_shipments');
        const shipments = pendingShipments ? JSON.parse(pendingShipments) : [];
        shipments.push(result.shipment);
        await AsyncStorage.setItem('pending_shipments', JSON.stringify(shipments));
      } catch (error) {
        console.warn('Error guardando envío pendiente:', error);
      }
      
      if (!user?.email) {
        Alert.alert('Error', 'No se encontró tu correo electrónico.');
        return;
      }

      try {
        setProcessingPayment(true);
        const paymentResponse = await createPayment({
          shipmentId: result.shipment.id,
          payerEmail: user.email,
          payerName: user.fullName || undefined,
        });

        const checkoutUrl = paymentResponse.checkoutUrl || paymentResponse.sandboxInitPoint || paymentResponse.initPoint;
        if (checkoutUrl) {
          await openBrowserAsync(checkoutUrl, {
            presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: colors.accent,
          });
        }
      } catch (error: any) {
        Alert.alert('Error al crear el pago', getErrorMessage(error));
      } finally {
        setProcessingPayment(false);
      }
    } else if (result.title && result.message) {
      showAlert(result.title, result.message);
    }
  };

  const isFormValid = useMemo(() => {
    return (
      formData.title.trim().length >= 3 &&
      Number(formData.weight) > 0 &&
      Number(formData.price) > 0 &&
      isValidAddress(formData.pickup) &&
      isValidAddress(formData.dropoff)
    );
  }, [formData]);

  return {
    ...form,
    imagePicker,
    alertRef,
    processingPayment,
    mapVisible,
    setMapVisible,
    mapTarget,
    mapInitialCoords,
    calculatingPrice,
    isFormValid,
    handleImageAdd,
    handleImageRemove,
    handleSelectAddress,
    handleConfirmLocation,
    handleSubmit,
  };
}
