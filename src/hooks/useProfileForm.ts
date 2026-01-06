import { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile, type Profile, type UpdateProfileData } from '../features/profile/service';
import { isValidEmail, isValidPhone, isValidAddress } from '../utils/validation';
import { useAuthStore } from '../store/useAuthStore';
import { isAuthError } from '../utils/errorHandler';

export type ProfileFormData = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  // Campos específicos para drivers
  license_number: string;
  vehicle_type: string;
  vehicle_plate: string;
  is_available: boolean;
  // Campos bancarios (para drivers)
  bank_account_type: 'checking' | 'savings' | 'cbu' | 'cvu' | 'alias' | '';
  bank_cbu: string;
  bank_cvu: string;
  bank_alias: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder_name: string;
  // Campos específicos para business
  business_name: string;
  business_address: string;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormData, string>>;

export function useProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    license_number: '',
    vehicle_type: '',
    vehicle_plate: '',
    is_available: true,
    bank_account_type: '',
    bank_cbu: '',
    bank_cvu: '',
    bank_alias: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder_name: '',
    business_name: '',
    business_address: '',
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const p = await getMyProfile();
      const authUser = useAuthStore.getState().user;
      
      setProfile(p);
      setFormData({
        full_name: p.full_name || '',
        phone: p.phone || '',
        email: p.email || authUser?.email || '',
        address: p.address || '',
        license_number: p.license_number || '',
        vehicle_type: p.vehicle_type || '',
        vehicle_plate: p.vehicle_plate || '',
        is_available: p.is_available ?? true,
        bank_account_type: p.bank_account_type || '',
        bank_cbu: p.bank_cbu || '',
        bank_cvu: p.bank_cvu || '',
        bank_alias: p.bank_alias || '',
        bank_name: p.bank_name || '',
        bank_account_number: p.bank_account_number || '',
        bank_account_holder_name: p.bank_account_holder_name || '',
        business_name: p.business_name || '',
        business_address: p.business_address || '',
      });
      setAvatarUri(p.avatar_url);
    } catch (error: any) {
      if (isAuthError(error)) return; // El error 401 ya se maneja globalmente en api.ts
      throw new Error(error.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: keyof ProfileFormData, value: string | boolean): string | null => {
    switch (field) {
      case 'full_name':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        if (typeof value === 'string' && value.trim().length > 120) {
          return 'El nombre no puede exceder 120 caracteres';
        }
        return null;
      case 'phone':
        if (value && typeof value === 'string' && !isValidPhone(value)) {
          return 'Teléfono inválido';
        }
        return null;
      case 'email':
        if (value && typeof value === 'string' && !isValidEmail(value)) {
          return 'Email inválido';
        }
        return null;
      case 'address':
        if (value && typeof value === 'string' && !isValidAddress(value)) {
          return 'La dirección debe tener al menos 10 caracteres';
        }
        return null;
      case 'license_number':
        if (value && typeof value === 'string' && value.trim().length < 5) {
          return 'El número de licencia debe tener al menos 5 caracteres';
        }
        return null;
      case 'vehicle_plate':
        if (value && typeof value === 'string' && value.trim().length < 4) {
          return 'La placa debe tener al menos 4 caracteres';
        }
        return null;
      default:
        return null;
    }
  };

  const updateField = (field: keyof ProfileFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: ProfileFormErrors = {};
    
    // Validar campos requeridos
    const fullNameError = validateField('full_name', formData.full_name);
    if (fullNameError) newErrors.full_name = fullNameError;

    // Validar campos opcionales si tienen valor
    if (formData.phone) {
      const phoneError = validateField('phone', formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }

    if (formData.email) {
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (formData.address) {
      const addressError = validateField('address', formData.address);
      if (addressError) newErrors.address = addressError;
    }

    // Validar campos específicos según el rol
    if (profile?.role === 'driver') {
      if (formData.license_number) {
        const licenseError = validateField('license_number', formData.license_number);
        if (licenseError) newErrors.license_number = licenseError;
      }
      if (formData.vehicle_plate) {
        const plateError = validateField('vehicle_plate', formData.vehicle_plate);
        if (plateError) newErrors.vehicle_plate = plateError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfile = async (avatarBase64?: string): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    try {
      setSaving(true);
      const updateData: UpdateProfileData = {
        full_name: formData.full_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      if (avatarBase64) {
        updateData.avatar_url = avatarBase64;
      }

      if (profile?.role === 'driver') {
        updateData.license_number = formData.license_number.trim() || undefined;
        updateData.vehicle_type = formData.vehicle_type.trim() || undefined;
        updateData.vehicle_plate = formData.vehicle_plate.trim() || undefined;
        updateData.is_available = formData.is_available;
        // Campos bancarios
        if (formData.bank_account_type) {
          updateData.bank_account_type = formData.bank_account_type as 'checking' | 'savings' | 'cbu' | 'cvu' | 'alias';
        }
        updateData.bank_cbu = formData.bank_cbu.trim() || undefined;
        updateData.bank_cvu = formData.bank_cvu.trim() || undefined;
        updateData.bank_alias = formData.bank_alias.trim() || undefined;
        updateData.bank_name = formData.bank_name.trim() || undefined;
        updateData.bank_account_number = formData.bank_account_number.trim() || undefined;
        updateData.bank_account_holder_name = formData.bank_account_holder_name.trim() || undefined;
      } else if (profile?.role === 'business') {
        updateData.business_name = formData.business_name.trim() || undefined;
        updateData.business_address = formData.business_address.trim() || undefined;
      }

      const updated = await updateMyProfile(updateData);
      setProfile(updated);
      if (updated.avatar_url) {
        setAvatarUri(updated.avatar_url);
      }
      return true;
    } catch (error: any) {
      if (isAuthError(error)) return false; // El error 401 ya se maneja globalmente en api.ts
      throw new Error(error.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    formData,
    errors,
    loading,
    saving,
    avatarUri,
    setAvatarUri,
    loadProfile,
    updateField,
    saveProfile,
    validateForm,
  };
}

