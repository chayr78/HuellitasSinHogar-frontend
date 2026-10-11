import { Injectable } from '@angular/core';
import type { NSFWJS } from 'nsfwjs/core';

// Umbrales de rechazo (de 0 a 1). Súbelos para ser más permisivo o bájalos para ser más estricto.
/** Se rechaza si la suma de "Porn" + "Hentai" llega a este valor. */
const UMBRAL_EXPLICITO = 0.6;
/** Se rechaza si "Sexy" llega a este valor. */
const UMBRAL_SUGERENTE = 0.85;

const MENSAJE_RECHAZO = 'La foto fue rechazada por contener contenido inapropiado. Sube otra imagen.';

/** Resultado de revisar una foto. */
export interface ResultadoModeracion {
  aceptada: boolean;
  motivo?: string;
}

/**
 * Revisa en el navegador si una foto tiene contenido inapropiado, con NSFWJS (sin API externa ni llaves).
 * El modelo viene dentro del paquete y se sirve desde nuestro propio sitio, no desde un CDN.
 */
@Injectable({ providedIn: 'root' })
export class ModeracionImagenService {
  /** Modelo ya cargado; se reutiliza en todas las revisiones. */
  private modelo: Promise<NSFWJS> | null = null;

  async validar(archivo: File): Promise<ResultadoModeracion> {
    const url = URL.createObjectURL(archivo);
    try {
      const modelo = await this.cargarModelo();
      const imagen = await this.crearImagen(url);
      const predicciones = await modelo.classify(imagen);

      // Probabilidad de cada categoría: Drawing, Hentai, Neutral, Porn, Sexy.
      const probabilidad = (clase: string) => predicciones.find((p) => p.className === clase)?.probability ?? 0;
      const explicito = probabilidad('Porn') + probabilidad('Hentai');
      const sugerente = probabilidad('Sexy');

      if (explicito >= UMBRAL_EXPLICITO || sugerente >= UMBRAL_SUGERENTE) {
        return { aceptada: false, motivo: MENSAJE_RECHAZO };
      }
      return { aceptada: true };
    } catch (error: unknown) {
      // Un fallo técnico (internet lento, navegador antiguo) no debe impedir que el usuario suba su foto.
      console.warn('No se pudo revisar la foto; se deja pasar.', error);
      return { aceptada: true };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Carga perezosa: TensorFlow.js y el modelo se descargan con import() la primera vez que se revisa una foto,
   * así no pesan en la carga inicial de la app. Se usa solo MobileNetV2 (el modelo más ligero).
   */
  private cargarModelo(): Promise<NSFWJS> {
    if (!this.modelo) {
      this.modelo = (async () => {
        const [{ load }, { MobileNetV2Model }] = await Promise.all([
          import('nsfwjs/core'),
          import('nsfwjs/models/mobilenet_v2'),
        ]);
        return load('MobileNetV2', { modelDefinitions: [MobileNetV2Model] });
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
