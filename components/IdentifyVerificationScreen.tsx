import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  ScrollView,
  RefreshControl
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/lib/api';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAlertStore } from '../src/store/useAlertStore';
import { getMyProfile, Profile } from '../src/features/profile/service';
import { colors, spacing, radii } from '../src/ui/theme';
import { Button } from '../src/ui/Button';

interface VerificationResponse {
  url: string;
}

type KYCStatus = 'approved' | 'declined' | 'in_review' | 'not_started' | null;

interface Props {
  onVerificationComplete?: (approved: boolean) => void;
  required?: boolean; // Si es true, bloquea la app hasta completar
}

export default function IdentityVerificationScreen({ 
  onVerificationComplete,
  required = false 
}: Props) {
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  
  const { user, role } = useAuthStore();
  const { showAlert } = useAlertStore();
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verificationStartedRef = useRef<boolean>(false);
  const isDriver = role === 'driver';

  // Normalizar el estado KYC (puede venir en diferentes formatos de Didit)
  const normalizeKycStatus = (status: string | null | undefined): KYCStatus => {
    if (!status) return 'not_started';
    // Convertir a minúsculas y reemplazar espacios con guiones bajos
    const normalized = status.toLowerCase().trim().replace(/\s+/g, '_');
    console.log('🔄 Normalizando estado:', status, '->', normalized);
    
    // Mapear estados comunes de Didit
    if (normalized === 'approved' || normalized.includes('approved') || normalized === 'completed') {
      return 'approved';
    }
    if (normalized === 'declined' || normalized.includes('declined') || normalized === 'rejected') {
      return 'declined';
    }
    if (normalized === 'in_review' || normalized.includes('review') || normalized.includes('progress') || normalized === 'in_progress') {
      return 'in_review';
    }
    if (normalized === 'not_started' || normalized.includes('not_started') || normalized.includes('pending') || normalized === 'notstarted') {
      return 'not_started';
    }
    
    // Si no coincide con ningún estado conocido, retornar not_started por defecto
    console.warn('⚠️ Estado KYC desconocido, usando not_started por defecto:', status, 'normalizado:', normalized);
    return 'not_started';
  };

  // Cargar perfil al montar
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verificar si necesita KYC al cargar
  useEffect(() => {
    if (isDriver && profile) {
      const status = normalizeKycStatus(profile.kyc_status);
      setKycStatus(status);
      console.log('📊 Estado KYC normalizado:', status, 'desde:', profile.kyc_status);
    }
  }, [profile, isDriver]);

  // Iniciar verificación automáticamente si es requerido (solo una vez)
  useEffect(() => {
    const normalizedStatus = normalizeKycStatus(profile?.kyc_status);
    const shouldStart = required && 
      isDriver && 
      profile && 
      normalizedStatus && 
      normalizedStatus !== 'approved' && 
      normalizedStatus !== 'in_review' && 
      !loading && 
      !verificationUrl && 
      user?.id &&
      !verificationStartedRef.current;
    
    console.log('🚀 Verificando si debe iniciar automáticamente:', {
      required,
      isDriver,
      hasProfile: !!profile,
      normalizedStatus,
      loading,
      hasUrl: !!verificationUrl,
      hasUser: !!user?.id,
      alreadyStarted: verificationStartedRef.current,
      shouldStart,
    });

    if (shouldStart) {
      console.log('✅ Iniciando verificación automáticamente...');
      verificationStartedRef.current = true;
      // Pequeño delay para evitar llamadas inmediatas múltiples
      const timer = setTimeout(() => {
        startVerification();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required, isDriver, profile, profile?.kyc_status, user?.id]);

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await getMyProfile();
      setProfile(profileData);
      const status = normalizeKycStatus(profileData.kyc_status);
      setKycStatus(status);
      console.log('📊 Perfil cargado - Estado KYC:', status, 'desde:', profileData.kyc_status);
    } catch (error: any) {
      console.error('Error cargando perfil:', error);
    }
  };

  const startVerification = async () => {
    if (!user?.id) {
      showAlert({
        title: 'Error',
        message: 'Debes estar autenticado para verificar tu identidad',
        buttons: [{ text: 'Aceptar' }],
      });
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (loading) {
      console.log('Verificación ya en proceso, ignorando llamada duplicada');
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando verificación para usuario:', user.id);
      const data = await api<VerificationResponse>('/kyc/start', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });

      console.log('Respuesta completa del API:', JSON.stringify(data, null, 2));

      if (data?.url) {
        // Validar que la URL sea válida
        if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
          throw new Error('URL de verificación inválida');
        }
        
        console.log('✅ URL de verificación obtenida y válida:', data.url);
        console.log('✅ Estableciendo verificationUrl y mostrando WebView...');
        setVerificationUrl(data.url);
        setWebViewVisible(true);
        setKycStatus('in_review');
        console.log('✅ Estados actualizados - verificationUrl establecida');
        // Iniciar polling para verificar el estado
        startPollingStatus();
      } else {
        console.error('Respuesta del API sin URL:', data);
        throw new Error('No se recibió la URL de verificación en la respuesta');
      }
    } catch (err: any) {
      console.error('Error iniciando verificación:', err);
      console.error('Error completo:', {
        message: err?.message,
        statusCode: err?.statusCode,
        code: err?.code,
        details: err?.details,
        name: err?.name,
      });
      
      // Resetear el flag para permitir reintentos
      verificationStartedRef.current = false;
      
      // Extraer mensaje de error (APIError tiene message, statusCode, code, details)
      let errorMessage = err?.message || 'Error al iniciar la verificación de identidad';
      
      // Manejar errores específicos
      if (err?.statusCode === 429 || err?.code === 'RATE_LIMIT_EXCEEDED') {
        errorMessage = 'Se han realizado demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente en unos minutos.';
      } else if (err?.statusCode === 409 || err?.code === 'VERIFICATION_IN_PROGRESS') {
        errorMessage = 'Ya existe una verificación en proceso. Por favor, espera a que se complete.';
        // Si hay una verificación en proceso, recargar el perfil para obtener el estado actual
        await loadProfile();
        // Recargar el estado después de cargar el perfil
        const updatedProfile = await getMyProfile();
        const updatedStatus = normalizeKycStatus(updatedProfile.kyc_status);
        setKycStatus(updatedStatus);
        
        // Si ahora el estado es in_review, no mostrar error, iniciar polling
        if (updatedStatus === 'in_review') {
          setLoading(false);
          startPollingStatus();
          return;
        }
      } else if (err?.details?.error) {
        // Si hay detalles con error, usar ese mensaje
        errorMessage = err.details.error;
      } else if (err?.details && typeof err.details === 'string') {
        errorMessage = err.details;
      }
      
      console.log('Mensaje de error final:', errorMessage);
      
      // Solo mostrar alerta si no es modo requerido (para no bloquear)
      if (!required) {
        showAlert({
          title: 'Error',
          message: errorMessage,
          buttons: [{ text: 'Aceptar' }],
        });
      }
      
      // En modo requerido, el error se mostrará en la UI (no hacer nada más aquí)
    } finally {
      setLoading(false);
    }
  };

  const startPollingStatus = () => {
    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Verificar estado cada 5 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedProfile = await getMyProfile();
        const newStatus = normalizeKycStatus(updatedProfile.kyc_status);
        
        setProfile(updatedProfile);
        setKycStatus(newStatus);
        console.log('🔄 Polling - Estado actualizado:', newStatus, 'desde:', updatedProfile.kyc_status);

        // Si el estado cambió a aprobado o rechazado, detener polling
        if (newStatus === 'approved' || newStatus === 'declined') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setWebViewVisible(false);
          setVerificationUrl(null);
          
          if (onVerificationComplete) {
            onVerificationComplete(newStatus === 'approved');
          }

          if (newStatus === 'approved') {
            showAlert({
              title: '¡Verificación exitosa!',
              message: 'Tu identidad ha sido verificada correctamente. Ya puedes usar la aplicación.',
              buttons: [{ 
                text: 'Continuar',
                onPress: () => {
                  // El callback onVerificationComplete ya fue llamado arriba
                  // Esto solo cierra la alerta
                }
              }],
            });
          } else if (newStatus === 'declined') {
            showAlert({
              title: 'Verificación rechazada',
              message: 'Tu verificación de identidad fue rechazada. Puedes intentar nuevamente.',
              buttons: [{ text: 'Entendido' }],
            });
          }
        }
      } catch (error) {
        console.error('Error verificando estado KYC:', error);
      }
    }, 5000);
  };

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      await loadProfile();
      showAlert({
        title: 'Estado actualizado',
        message: 'Se ha verificado el estado de tu verificación de identidad.',
        buttons: [{ text: 'Aceptar' }],
      });
    } catch {
      showAlert({
        title: 'Error',
        message: 'No se pudo verificar el estado. Intenta nuevamente.',
        buttons: [{ text: 'Aceptar' }],
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleWebViewClose = () => {
    setWebViewVisible(false);
    setVerificationUrl(null);
    // Continuar verificando el estado
    if (!pollingIntervalRef.current) {
      startPollingStatus();
    }
  };

  // Si no es driver, no mostrar nada
  if (!isDriver) {
    return null;
  }

  // Si está aprobado y no es requerido, no mostrar nada
  if (kycStatus === 'approved' && !required) {
    return null;
  }

  // DEBUG: Log del estado actual (normalizar para mostrar)
  const currentNormalizedStatus = normalizeKycStatus(profile?.kyc_status || kycStatus);
  console.log('🔍 DEBUG Render - required:', required, 'kycStatus (normalizado):', currentNormalizedStatus, 'kycStatus (raw):', kycStatus, 'profile.kyc_status:', profile?.kyc_status, 'verificationUrl:', verificationUrl, 'loading:', loading);

  // Si es requerido, solo mostrar loading o WebView, sin pantalla inicial
  if (required) {
    // PRIORIDAD 1: Mostrar WebView si tenemos URL (esto tiene la máxima prioridad)
    if (verificationUrl) {
      console.log('✅ RENDERIZANDO WebView - URL disponible:', verificationUrl);
      console.log('✅ verificationUrl type:', typeof verificationUrl);
      console.log('✅ verificationUrl length:', verificationUrl?.length);
      return (
        <View style={styles.webviewContainer}>
          <WebView 
            source={{ uri: verificationUrl }} 
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Cargando verificación...</Text>
              </View>
            )}
            onNavigationStateChange={({ url }) => {
              console.log('WebView navegó a:', url);
              // NO cerrar automáticamente - dejar que el usuario complete el flujo
              // El polling se encargará de detectar cuando termine la verificación
              // Solo cerrar si la URL cambia a algo completamente diferente (como un callback)
              if (url && !url.includes('didit.me') && !url.includes('didit')) {
                console.log('⚠️ URL cambió a dominio no-Didit, posible finalización');
                // No cerrar inmediatamente, dejar que el polling detecte el cambio de estado
              }
            }}
            onLoadStart={() => {
              console.log('WebView comenzó a cargar:', verificationUrl);
            }}
            onLoadEnd={() => {
              console.log('WebView terminó de cargar');
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              showAlert({
                title: 'Error',
                message: `Error al cargar la página de verificación: ${nativeEvent.description || 'Error desconocido'}`,
                buttons: [{ text: 'Aceptar', onPress: handleWebViewClose }],
              });
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent);
              showAlert({
                title: 'Error HTTP',
                message: `Error HTTP ${nativeEvent.statusCode}: ${nativeEvent.description || 'Error al cargar la página'}`,
                buttons: [{ text: 'Aceptar', onPress: handleWebViewClose }],
              });
            }}
          />
        </View>
      );
    }

    // PRIORIDAD 2: Mostrar loading mientras se obtiene la URL
    if (loading && !verificationUrl) {
      console.log('⏳ Mostrando loading - esperando URL...');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Iniciando verificación...</Text>
        </View>
      );
    }

    // PRIORIDAD 3: Si está en revisión pero no tenemos URL, mostrar estado de proceso
    if (kycStatus === 'in_review' && !verificationUrl) {
      console.log('🔄 Estado en revisión pero sin URL - mostrando estado de proceso');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Verificación en proceso...</Text>
          <Text style={styles.infoTextSecondary}>
            Tu verificación está siendo procesada. Te notificaremos cuando se complete.
          </Text>
          <Button
            title="Verificar Estado"
            onPress={checkStatus}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
      );
    }

    // PRIORIDAD 4: Si no hay URL y no está cargando, verificar el estado actual
    console.log('❌ Estado actual - kycStatus:', kycStatus, 'loading:', loading, 'verificationUrl:', verificationUrl);

    // Si el perfil aún no está cargado, mostrar loading
    // NO mostrar error hasta que tengamos el perfil cargado
    if (!profile) {
      console.log('⏳ Esperando perfil...');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      );
    }

    // Si no hay URL, no está cargando y no está en revisión, mostrar error con opción de reintentar
    // Esto solo debería aparecer si hubo un error real DESPUÉS de intentar iniciar
    // Verificar que realmente intentamos iniciar (verificationStartedRef.current === true)
    // y que no estamos esperando que se complete la carga inicial
    if (verificationStartedRef.current && !loading) {
      return (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Error al iniciar la verificación</Text>
          <Text style={styles.errorDescription}>
            No se pudo iniciar el proceso de verificación. Por favor, intenta nuevamente.
          </Text>
          <Text style={[styles.errorDescription, { fontSize: 12, marginTop: spacing.sm }]}>
            Estado: {kycStatus || 'desconocido'}
          </Text>
          <Button
            title="Reintentar"
            onPress={() => {
              console.log('Reintentando verificación...');
              verificationStartedRef.current = false;
              setLoading(false);
              setVerificationUrl(null);
              startVerification();
            }}
            style={{ marginTop: spacing.md }}
          />
        </View>
      );
    }

    // Si aún no hemos intentado iniciar, mostrar loading mientras se prepara
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Preparando verificación...</Text>
      </View>
    );
  }

  // Mostrar WebView si está visible y tenemos una URL válida (modo no requerido)
  if (webViewVisible && verificationUrl) {
    console.log('Mostrando WebView con URL:', verificationUrl);
    return (
      <View style={styles.webviewContainer}>
        <View style={styles.webviewHeader}>
          <Text style={styles.webviewTitle}>Verificación de Identidad</Text>
          <TouchableOpacity onPress={handleWebViewClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <WebView 
          source={{ uri: verificationUrl }} 
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Cargando verificación...</Text>
            </View>
          )}
          onNavigationStateChange={({ url }) => {
            console.log('WebView navegó a:', url);
            // NO cerrar automáticamente - dejar que el usuario complete el flujo
            // El polling se encargará de detectar cuando termine la verificación
            // Solo cerrar si la URL cambia a algo completamente diferente (como un callback)
            if (url && !url.includes('didit.me') && !url.includes('didit')) {
              console.log('⚠️ URL cambió a dominio no-Didit, posible finalización');
              // No cerrar inmediatamente, dejar que el polling detecte el cambio de estado
            }
          }}
          onLoadStart={() => {
            console.log('WebView comenzó a cargar:', verificationUrl);
          }}
          onLoadEnd={() => {
            console.log('WebView terminó de cargar');
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            showAlert({
              title: 'Error',
              message: `Error al cargar la página de verificación: ${nativeEvent.description || 'Error desconocido'}`,
              buttons: [{ text: 'Aceptar', onPress: handleWebViewClose }],
            });
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent);
            showAlert({
              title: 'Error HTTP',
              message: `Error HTTP ${nativeEvent.statusCode}: ${nativeEvent.description || 'Error al cargar la página'}`,
              buttons: [{ text: 'Aceptar', onPress: handleWebViewClose }],
            });
          }}
        />
      </View>
    );
  }

  // Pantalla inicial
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={64} color={colors.accent} />
        </View>
        <Text style={styles.title}>Verificación de Identidad</Text>
        <Text style={styles.description}>
          Para continuar como conductor, necesitamos verificar tu identidad mediante un proceso seguro y rápido.
        </Text>
      </View>

      {/* Estado actual */}
      {kycStatus && (
        <View style={styles.statusContainer}>
          {kycStatus === 'approved' && (
            <View style={[styles.statusBadge, styles.statusSuccess]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.statusText}>Verificación completada</Text>
            </View>
          )}
          {kycStatus === 'in_review' && (
            <View style={[styles.statusBadge, styles.statusWarning]}>
              <ActivityIndicator size="small" color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>Verificación en proceso...</Text>
            </View>
          )}
          {kycStatus === 'declined' && (
            <View style={[styles.statusBadge, styles.statusError]}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.statusText}>Verificación rechazada</Text>
            </View>
          )}
          {kycStatus === 'not_started' && (
            <View style={[styles.statusBadge, styles.statusInfo]}>
              <Ionicons name="information-circle" size={20} color={colors.muted} />
              <Text style={styles.statusText}>Pendiente de verificación</Text>
            </View>
          )}
        </View>
      )}

      {/* Información adicional */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="lock-closed" size={20} color={colors.accent} />
          <Text style={styles.infoText}>Proceso 100% seguro</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={20} color={colors.accent} />
          <Text style={styles.infoText}>Toma solo unos minutos</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="document-text" size={20} color={colors.accent} />
          <Text style={styles.infoText}>Necesitarás tu documento de identidad</Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        {(kycStatus === 'not_started' || kycStatus === 'declined') && (
          <Button
            title={loading ? 'Iniciando...' : 'Iniciar Verificación'}
            onPress={startVerification}
            loading={loading}
            disabled={loading}
            style={styles.primaryButton}
          />
        )}

        {kycStatus === 'in_review' && (
          <>
            <Text style={styles.inReviewText}>
              Tu verificación está en proceso. Te notificaremos cuando se complete.
            </Text>
            <Button
              title={checkingStatus ? 'Verificando...' : 'Verificar Estado'}
              onPress={checkStatus}
              loading={checkingStatus}
              disabled={checkingStatus}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </>
        )}

        {kycStatus === 'approved' && required && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.successText}>
              ¡Tu identidad ha sido verificada exitosamente!
            </Text>
            {onVerificationComplete && (
              <Button
                title="Continuar"
                onPress={() => onVerificationComplete(true)}
                style={styles.primaryButton}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  statusContainer: {
    marginBottom: spacing.xl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  statusSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusError: {
    backgroundColor: '#FEE2E2',
  },
  statusInfo: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    marginLeft: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  infoTextSecondary: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionsContainer: {
    width: '100%',
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
  inReviewText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  successText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    fontWeight: '600',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.muted,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorDescription: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
