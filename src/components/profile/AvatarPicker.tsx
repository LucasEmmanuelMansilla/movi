import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../../ui/theme';
import ImageSourceModal from '../ui/ImageSourceModal';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: object;
  textStyle?: object;
}

interface AvatarPickerProps {
  avatarUri: string | null;
  onAvatarChange: (uri: string) => void;
  onShowAlert?: (title: string, message: string, buttons?: AlertButton[]) => void;
  onCloseAlert?: () => void;
  size?: number;
}

export function AvatarPicker({ avatarUri, onAvatarChange, onShowAlert, onCloseAlert, size = 120 }: AvatarPickerProps) {
  const modalRef = useRef<{ show: () => void; hide: () => void }>(null);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      if (onShowAlert) {
        onShowAlert(
          'Permisos necesarios',
          'Necesitamos permisos para acceder a la cámara y galería para cambiar tu foto de perfil.'
        );
      }
      return false;
    }
    
    return true;
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result: ImagePicker.ImagePickerResult;

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
        // allowsMultipleSelection: false,
        // exif: false,
        base64: true,
      };

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }

      if (!result.canceled && result.assets[0]) {
        onAvatarChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      if (onShowAlert) {
        onShowAlert('Error', 'No se pudo seleccionar la imagen');
      }
    }
  };

  const handleChangeAvatar = () => {
    modalRef.current?.show();
  };

  const handleSelectSource = (source: 'camera' | 'gallery') => {
    handlePickImage(source);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8}>
          <View style={[styles.avatarContainer, { width: size, height: size }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri.startsWith('file:') ? avatarUri : 'data:image/jpeg;base64,' + avatarUri }} style={[styles.avatar, { width: size, height: size }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { width: size, height: size }]}>
                <Ionicons name="person" size={size * 0.5} color={colors.muted} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.hint}>Toca para cambiar tu foto</Text>
      </View>
      <ImageSourceModal
        ref={modalRef}
        onSelectSource={handleSelectSource}
        title="Cambiar foto de perfil"
        message="¿Cómo deseas cambiar tu foto?"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 1000,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    borderRadius: 1000,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: colors.accent,
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.muted,
  },
});

