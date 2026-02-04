import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useProfileForm } from './useProfileForm';
import { signOutAll } from '../features/profile/service';
import { imageToBase64 } from '../utils/imageConverter';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: object;
  textStyle?: object;
}

export function useProfileScreenLogic() {
  const alertRef = useRef<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const form = useProfileForm();
  const { profile, formData, saveProfile, loadProfile, avatarUri } = form;

  const showAlert = (title: string, message: string, buttons: AlertButton[] = []) => {
    if (alertRef.current) {
      alertRef.current.show({
        title,
        message,
        buttons: buttons.length > 0 ? buttons : [{ text: 'Aceptar' }],
      });
    }
  };

  const closeAlert = () => {
    if (alertRef.current) {
      alertRef.current.hide();
    }
  };

  useEffect(() => {
    loadProfile().catch((e: any) => {
      showAlert('Error', e.message || 'No se pudo cargar el perfil');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      const changed = 
        formData.full_name !== (profile.full_name || '') ||
        formData.phone !== (profile.phone || '') ||
        formData.email !== (profile.email || '') ||
        formData.address !== (profile.address || '') ||
        (profile.role === 'driver' && (
          formData.license_number !== (profile.license_number || '') ||
          formData.vehicle_type !== (profile.vehicle_type || '') ||
          formData.vehicle_plate !== (profile.vehicle_plate || '') ||
          formData.is_available !== (profile.is_available ?? true) ||
          formData.bank_account_type !== (profile.bank_account_type || '') ||
          formData.bank_cbu !== (profile.bank_cbu || '') ||
          formData.bank_cvu !== (profile.bank_cvu || '') ||
          formData.bank_alias !== (profile.bank_alias || '') ||
          formData.bank_name !== (profile.bank_name || '') ||
          formData.bank_account_number !== (profile.bank_account_number || '') ||
          formData.bank_account_holder_name !== (profile.bank_account_holder_name || '')
        )) ||
        (profile.role === 'business' && (
          formData.business_name !== (profile.business_name || '') ||
          formData.business_address !== (profile.business_address || '')
        ));
      setHasChanges(changed);
    }
  }, [formData, profile]);

  const handleSave = async () => {
    if (__DEV__) {
      console.log('[handleSave] Inicio', {
        avatarUri: avatarUri ? `${avatarUri.slice(0, 50)}...` : null,
        convierteAvatar: !!(avatarUri && avatarUri.startsWith('file://')),
      });
    }
    try {
      let avatarBase64: string | undefined;
      if (avatarUri && avatarUri.startsWith('file://')) {
        if (__DEV__) console.log('[handleSave] Convirtiendo imagen a base64...');
        avatarBase64 = await imageToBase64(avatarUri);
        if (__DEV__) console.log('[handleSave] Imagen convertida', { length: avatarBase64?.length ?? 0 });
      }

      const success = await saveProfile(avatarBase64);
      if (__DEV__) console.log('[handleSave] saveProfile resultado', { success });
      if (success) {
        showAlert('Éxito', 'Perfil actualizado correctamente');
        setHasChanges(false);
      } else {
        if (__DEV__) console.warn('[handleSave] saveProfile devolvió false (validación o auth)');
      }
    } catch (e: any) {
      const statusCode = e?.statusCode ?? e?.status;
      const details = e?.details ?? e?.response;
      if (__DEV__) {
        console.error('[handleSave] Error', {
          message: e?.message,
          statusCode,
          details,
          name: e?.name,
          full: e,
        });
      }
      const detailStr = details && typeof details === 'object'
        ? (Array.isArray(details) ? details.join(', ') : JSON.stringify(details))
        : '';
      const mensaje = e?.message === 'invalid data' && detailStr
        ? `Datos inválidos: ${detailStr}`
        : (e?.message || 'No se pudo actualizar el perfil');
      showAlert('Error', mensaje);
    }
  };

  const handleLogout = () => {
    showAlert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { 
          text: 'Cancelar',
          onPress: closeAlert,
        },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            closeAlert();
            await signOutAll();
            router.push('/login');
          },
          style: { backgroundColor: '#EF4444' },
          textStyle: { color: '#fff' },
        },
      ]
    );
  };

  return {
    ...form,
    alertRef,
    hasChanges,
    showAlert,
    closeAlert,
    handleSave,
    handleLogout,
  };
}
