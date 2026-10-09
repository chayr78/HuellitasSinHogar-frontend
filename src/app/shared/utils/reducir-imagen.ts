const LADO_MAXIMO_POR_DEFECTO_PX = 1600;
const CALIDAD_JPEG = 0.85;

/**
 * Achica una foto en el navegador antes de subirla: respeta la orientación de la cámara,
 * limita el lado mayor a `ladoMaximo` px (1600 por defecto) y la guarda como JPEG. Lanza un error si la imagen no se puede leer.
 */
export async function reducirImagen(archivo: File, ladoMaximo = LADO_MAXIMO_POR_DEFECTO_PX): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });

  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);

  const contexto = canvas.getContext('2d');
  if (!contexto) {
    bitmap.close();
    throw new Error('Sin contexto 2D');
  }
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG));
  if (!blob) {
    throw new Error('No se pudo exportar la imagen');
  }
  return blob;
}
