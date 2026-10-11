import { Injectable } from '@angular/core';
import type { MobileNet } from '@tensorflow-models/mobilenet';
import type { Tensor2D } from '@tensorflow/tfjs';

/** Modelo MobileNet v1 (0.25), unos 2 MB, servido desde nuestra carpeta public/ (no desde un CDN). */
const MODELO_URL = '/modelos/mobilenet/model.json';

// MobileNet reconoce 1000 clases de ImageNet. De la 151 a la 293 están los perros (todas las razas),
// los cánidos salvajes (lobo, coyote...), los gatos y los felinos grandes. Se incluyen los "parecidos"
// porque en fotos oscuras o de cerca el modelo a veces confunde a un perro con un león o un lobo.
const PRIMERA_CLASE_ANIMAL = 151;
const ULTIMA_CLASE_ANIMAL = 293;

/** Si la probabilidad sumada de esas clases llega a este valor, se considera que hay un perro o gato. */
const UMBRAL_MASCOTA = 0.35;

/**
 * Revisa en el navegador si una foto parece tener un perro o un gato (solo para fotos de mascotas).
 * No bloquea: el componente solo muestra un aviso y el usuario decide si la usa.
 */
@Injectable({ providedIn: 'root' })
export class DeteccionMascotaService {
  /** Modelo ya cargado; se reutiliza en todas las revisiones. */
  private modelo: Promise<MobileNet> | null = null;

  /** True si la foto parece tener un perro o gato. Ante cualquier error responde true (no molestar al usuario). */
  async contieneMascota(archivo: File): Promise<boolean> {
    const url = URL.createObjectURL(archivo);
    try {
      const [modelo, tf] = await Promise.all([this.cargarModelo(), import('@tensorflow/tfjs')]);
      const imagen = await this.crearImagen(url);

      // infer() da un puntaje por clase; softmax lo convierte en probabilidades que suman 1.
      // tidy() libera los tensores intermedios; el resultado se libera a mano con dispose() para no gastar memoria.
      const resultado = tf.tidy(() => tf.softmax(modelo.infer(imagen) as Tensor2D));
      const probabilidades = resultado.dataSync();
      resultado.dispose();

      let probabilidadAnimal = 0;
      for (let clase = PRIMERA_CLASE_ANIMAL; clase <= ULTIMA_CLASE_ANIMAL; clase++) {
        probabilidadAnimal += probabilidades[clase];
      }
      return probabilidadAnimal >= UMBRAL_MASCOTA;
    } catch (error: unknown) {
      console.warn('No se pudo revisar si la foto tiene una mascota; se deja pasar.', error);
      return true;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Carga perezosa: TensorFlow.js y MobileNet se descargan la primera vez que se revisa una foto. */
  private cargarModelo(): Promise<MobileNet> {
    if (!this.modelo) {
      this.modelo = (async () => {
        // Importar @tensorflow/tfjs registra los motores (WebGL/CPU) que MobileNet necesita para correr.
        await import('@tensorflow/tfjs');
        const { load } = await import('@tensorflow-models/mobilenet');
        return load({ version: 1, alpha: 0.25, modelUrl: MODELO_URL, inputRange: [0, 1] });
      })();
      // Si falla la carga, se borra para volver a intentarlo con la siguiente foto.
      this.modelo.catch(() => (this.modelo = null));
    }
    return this.modelo;
  }

  /** Crea un <img> temporal con la foto y espera a que termine de cargar. */
  private crearImagen(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const imagen = new Image();
      imagen.onload = () => resolve(imagen);
      imagen.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      imagen.src = url;
    });
  }
}
