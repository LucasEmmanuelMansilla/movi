// apps/movi/src/features/auth/supabaseAuth.ts
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export async function signUpWithEmail(
  email: string,
  password: string,
  role: 'driver' | 'business',
  fullName?: string,
  phone?: string
) {
  try {
    const emailLimpio = email.trim();
    
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      throw new Error('Por favor ingresa un correo electrónico válido');
    }

    // 1. Sign up the user
    const { data, error } = await supabase.auth.signUp({ 
      email: emailLimpio, 
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone
        },
        emailRedirectTo: 'movi://auth/callback'
      }
    });

    if (error) throw error;

    // 2. If email confirmation is required
    if (!data.session) {
      return { 
        success: true, 
        requiresConfirmation: true,
        message: 'Por favor revisa tu correo para confirmar tu cuenta'
      };
    }

    // 3. If email confirmation is not required
    return { 
      success: true, 
      requiresConfirmation: false,
      user: data.user
    };

  } catch (error) {
    console.error('Error in signUpWithEmail:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    
    if (error) throw error;
    if (data.session) {
      await useAuthStore.getState().applySession(data.session);
    } else {
      await useAuthStore.getState().bootstrap();
    }

    return { success: true, user: data.user };

  } catch (error) {
    console.error('Error in signInWithEmail:', error);
    throw error;
  }
}

export async function signOut() {
  await useAuthStore.getState().signOut();
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: 'movi://auth/callback'
    }
  });
  if (error) throw error;
}

// Handle password reset
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'movi://auth/reset-password'
  });
  if (error) throw error;
}

// Update user profile
export async function updateProfile(updates: {
  full_name?: string;
  phone?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user logged in');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;

  // Update local state
  if (updates.full_name || updates.phone) {
    await useAuthStore.getState().refreshProfile(user.id);
  }
}