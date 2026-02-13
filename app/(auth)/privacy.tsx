import React from 'react';
import PrivacyPolicyScreen from '../../src/components/PrivacyPolicyScreen';

/**
 * Pantalla para consultar las Políticas de Privacidad (antes de registro/login).
 * Accesible desde login y formulario de registro.
 */
export default function PrivacyScreen() {
  return (
    <PrivacyPolicyScreen requireAccept={false} showBackButton={true} />
  );
}
