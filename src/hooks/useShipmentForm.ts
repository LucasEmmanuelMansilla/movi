import { useState, useCallback } from 'react';
import { createShipment } from '../features/shipments/service';
import { getErrorMessage } from '../utils/errorHandler';
import { isValidAddress, isValidPrice, sanitizeString } from '../utils/validation';
import { imagesToBase64 } from '../utils/imageConverter';
import type { LocationPayload } from './useLocationPicker';

export interface ShipmentFormData {
  title: string;
  description: string;
  pickup: string;
  dropoff: string;
  price: string;
  images: string[];
  location?: LocationPayload;
}

export interface FormErrors {
  title?: string;
  pickup?: string;
  dropoff?: string;
  price?: string;
}

const initialFormData: ShipmentFormData = {
  title: '',
  description: '',
  pickup: '',
  dropoff: '',
  price: '',
  images: [],
  location: undefined,
};

export function useShipmentForm() {
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof ShipmentFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    }

    if (!formData.pickup.trim() || !isValidAddress(formData.pickup)) {
      newErrors.pickup = 'La dirección de retiro debe tener al menos 10 caracteres';
    }

    if (!formData.dropoff.trim() || !isValidAddress(formData.dropoff)) {
      newErrors.dropoff = 'La dirección de entrega debe tener al menos 10 caracteres';
    }

    if (formData.price && !isValidPrice(formData.price)) {
      newErrors.price = 'El precio debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submitForm = useCallback(async (): Promise<{ success: boolean; message?: string; title?: string; shipment?: any }> => {
    if (!validateForm()) {
      return {
        success: false,
        title: 'Error',
        message: 'Por favor corrige los errores en el formulario',
      };
    }

    try {
      setLoading(true);
      setErrors({});
      
      // Convertir imágenes a base64
      const imageData = formData.images.length > 0
        ? await imagesToBase64(formData.images)
        : undefined;

      const shipment = await createShipment({
        title: sanitizeString(formData.title),
        description: formData.description.trim() ? sanitizeString(formData.description) : undefined,
        pickup_address: sanitizeString(formData.pickup),
        dropoff_address: sanitizeString(formData.dropoff),
        price: formData.price ? Number(formData.price) : undefined,
        images: imageData,
        location: formData.location,
      });
      
      // Resetear formulario
      setFormData(initialFormData);
      return {
        success: true,
        title: 'Éxito',
        message: 'Envío creado exitosamente',
        shipment,
      };
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      return {
        success: false,
        title: 'Error',
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    loading,
    updateField,
    submitForm,
    resetForm,
    setFormData,
  };
}

