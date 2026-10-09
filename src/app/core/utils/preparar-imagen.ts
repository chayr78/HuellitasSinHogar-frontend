import { reducirImagen } from '../../shared/utils/reducir-imagen';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/** Error de una foto que no se puede subir; `message` ya viene listo para mostrarlo al usuario. */
export class ErrorImagen extends Error {}

/** True si el archivo es JPEG, PNG o WebP. */
export function esFormatoPermitido(archivo: File): boolean {
  return TIPOS_PERMITIDOS.includes(archivo.type);
}

/**
 * Deja una foto lista para subir: valida el formato, corrige la orientación, la achica
 * (lado mayor `ladoMaximo` px, JPEG 0.85) y revisa que pese 5 MB o menos. Si algo falla, lanza ErrorImagen.
 */
export async function prepararImagen(archivo: File, ladoMaximo = 1600): Promise<Blob> {
  if (!esFormatoPermitido(archivo)) {
    throw new ErrorImagen('Formato no permitido. Usa una foto JPEG, PNG o WebP.');
  }
  let reducida: Blob;
  try {
    reducida = await reducirImagen(archivo, ladoMaximo);
  } catch {
    throw new ErrorImagen('No pudimos procesar esta imagen, prueba con otra.');
  }
  if (reducida.size > TAMANO_MAXIMO_BYTES) {
    throw new ErrorImagen('La imagen es demasiado grande. Prueba con otra foto.');
  }
  return reducida;
}
