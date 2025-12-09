/**
 * Utilidades de validación
 */

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  return emailRegex.test(email.trim());
}

/**
 * Valida un teléfono
 */
export function isValidPhone(phone: string): boolean {
  return phoneRegex.test(phone.trim());
}

/**
 * Valida una contraseña según los requisitos
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Debe contener al menos un símbolo especial');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitiza un string removiendo espacios y caracteres peligrosos
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Valida que un string no esté vacío
 */
export function isNotEmpty(value: string): boolean {
  return sanitizeString(value).length > 0;
}

/**
 * Valida una dirección (mínimo 10 caracteres)
 */
export function isValidAddress(address: string): boolean {
  return sanitizeString(address).length >= 10;
}

/**
 * Valida un precio (debe ser un número positivo)
 */
export function isValidPrice(price: string | number): boolean {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(num) && num >= 0;
}

