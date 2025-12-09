/**
 * Utilidades para conversión de imágenes
 */

/**
 * Convierte una imagen (URI) a base64
 */
export async function imageToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remover el prefijo data:image/... si existe
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al convertir imagen a base64:', error);
    throw new Error('Error al procesar la imagen');
  }
}

/**
 * Convierte múltiples imágenes a base64 en paralelo
 */
export async function imagesToBase64(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map(uri => imageToBase64(uri)));
}

