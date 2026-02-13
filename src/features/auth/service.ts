import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

export async function signUpWithEmail(
  email: string, 
  password: string, 
  role: 'driver' | 'business', 
  fullName?: string,
  privacyPolicyAccepted?: boolean
) {
  try {
    const emailLimpio = email.trim();
    
    // Validación de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      throw new Error('Por favor ingresa un correo electrónico válido');
    }

    // Validar que el rol esté definido
    if (!role || (role !== 'driver' && role !== 'business')) {
      console.error('❌ Error: Rol inválido en signUpWithEmail:', role);
      throw new Error('Rol inválido. Debe ser "driver" o "business"');
    }

    console.log(`🔐 Registrando usuario: ${emailLimpio}, rol: ${role}, nombre: ${fullName || 'N/A'}`);

    // 1. Registrar al usuario
    const { data, error } = await supabase.auth.signUp({ 
      email: emailLimpio, 
      password,
      options: {
        data: {
          full_name: fullName,
          role: role // Asegurar que el rol se guarda en user_metadata
        },
        // Redirección después de confirmar el email
        emailRedirectTo: 'movi://auth/callback'
      }
    });

    console.log(`📧 SignUp response - Usuario creado: ${data.user ? 'Sí' : 'No'}, Sesión: ${data.session ? 'Sí' : 'No'}, Rol en metadata: ${data.user?.user_metadata?.role || 'N/A'}`);

    if (error) {
      console.error('Error en registro:', error);
      throw error;
    }

    // 2. Si hay sesión (confirmación automática desactivada)
    if (data.session) {
      console.log(`✅ Sesión creada inmediatamente, haciendo exchange con rol: ${role}`);
      const { token, error: exchangeError } = await exchangeToken(
        data.session.access_token,
        role,
        fullName,
        privacyPolicyAccepted
      );
      
      if (exchangeError) {
        console.error('❌ Error en exchange:', exchangeError);
        throw exchangeError;
      }
      console.log(`✅ Exchange completado exitosamente con rol: ${role}`);
      return { success: true, requiresConfirmation: false };
    }

    // 3. Si no hay sesión (se requiere confirmación)
    return { 
      success: true, 
      requiresConfirmation: true,
      message: 'Por favor revisa tu correo para confirmar tu cuenta'
    };

  } catch (error) {
    console.error('Error en signUpWithEmail:', error);
    throw error;
  }
}

// Función auxiliar para intercambiar tokens
async function exchangeToken(
  accessToken: string, 
  role: 'driver' | 'business',
  fullName?: string,
  privacyPolicyAccepted?: boolean
) {
  try {
    console.log(`🔄 Haciendo exchange con rol: ${role}, nombre: ${fullName || 'N/A'}`);
    
    const requestBody: Record<string, unknown> = { 
      access_token: accessToken, 
      role, 
      full_name: fullName 
    };
    if (privacyPolicyAccepted === true) {
      requestBody.privacy_policy_accepted = true;
    }
    
    console.log('📤 Request body:', JSON.stringify({ ...requestBody, access_token: '***' }));
    
    const res = await api<{ token: string; role: 'driver' | 'business' }>(
      `/auth/exchange`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    console.log(`✅ Exchange response - Rol recibido del servidor: ${res.role}`);

    // useAuthStore.getState().setToken(res.token);
    useAuthStore.getState().setRole(res.role);
    
    return { token: res.token, error: null };
  } catch (error: any) {
    console.error('❌ Error en exchangeToken:', error);
    return { token: null, error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    
    if (error) {
      // Handle unconfirmed user error
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please confirm your email before signing in');
      }
      throw error;
    }
  
    const access_token = data.session?.access_token;
    if (!access_token) {
      throw new Error('Could not sign in. Please try again.');
    }

    // Obtener los datos del usuario para extraer el rol de user_metadata
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error al obtener usuario en signIn:', userError);
    }

    const user = userData?.user;
    const roleFromMetadata = user?.user_metadata?.role as 'driver' | 'business' | undefined;
    const fullName = user?.user_metadata?.full_name as string | undefined;

    console.log(`🔐 SignIn - Usuario: ${email}, Rol en metadata: ${roleFromMetadata || 'N/A'}, Nombre: ${fullName || 'N/A'}`);
    
    // Exchange Supabase token for our JWT token
    // IMPORTANTE: Pasar el rol y nombre para que el servidor los use
    const exchangeBody: any = { access_token };
    if (roleFromMetadata) {
      exchangeBody.role = roleFromMetadata;
      console.log(`✅ Pasando rol al exchange: ${roleFromMetadata}`);
    }
    if (fullName) {
      exchangeBody.full_name = fullName;
    }

    console.log(`🔄 SignIn - Haciendo exchange con:`, JSON.stringify({ ...exchangeBody, access_token: '***' }));

    const res = await api<{ token: string; role: 'driver' | 'business' }>(
      `/auth/exchange`,
      {
        method: 'POST',
        body: JSON.stringify(exchangeBody),
      }
    );

    console.log(`✅ SignIn - Exchange completado. Rol recibido del servidor: ${res.role}`);

    // Establecer la sesión y el rol
    if (data.session) {
      await useAuthStore.getState().applySession(data.session);
    }
    useAuthStore.getState().setRole(res.role);
    
    return res;
  } catch (error) {
    console.log('Error in signInWithEmail server:', error);
    throw error;
  }
}

export function signOutLocal() {
  //useAuthStore.getState().setToken(null);
  useAuthStore.getState().setRole(null);
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  if (error) throw error;
  return true;
}