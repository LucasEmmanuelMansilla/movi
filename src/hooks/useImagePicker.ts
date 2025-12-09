import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const MAX_IMAGES = 5;

export type ImageUri = string;

export function useImagePicker() {
  const [images, setImages] = useState<ImageUri[]>([]);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Necesitamos permisos para acceder a la cámara y galería para agregar fotos.'
      );
      return false;
    }
    
    return true;
  };

  const pickImage = async (source: 'camera' | 'gallery'): Promise<void> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: true,
        });
      }

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        const totalImages = images.length + newImages.length;
        
        if (totalImages > MAX_IMAGES) {
          const imagesToAdd = MAX_IMAGES - images.length;
          setImages(prev => [...prev, ...newImages.slice(0, imagesToAdd)]);
          Alert.alert('Límite alcanzado', `Solo puedes agregar hasta ${MAX_IMAGES} fotos`);
        } else {
          setImages(prev => [...prev, ...newImages]);
        }
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const removeImage = (index: number): void => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = (): void => {
    setImages([]);
  };

  const canAddMore = images.length < MAX_IMAGES;

  return {
    images,
    pickImage,
    removeImage,
    clearImages,
    canAddMore,
    maxImages: MAX_IMAGES,
  };
}

