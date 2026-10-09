// Ayudas para trabajar con las respuestas del backend, que siempre vienen como { exito, mensaje, datos }.
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../models/api-response.model';

/** Devuelve solo `datos` de la respuesta. Si el backend responde `exito: false`, lo convierte en error. */
export function extraerDatos<T>(peticion: Observable<ApiResponse<T>>): Observable<T> {
  return peticion.pipe(
    map((respuesta) => {
      if (!respuesta.exito) {
        throw new Error(respuesta.mensaje);
      }
      return respuesta.datos;
    }),
  );
}

/** Devuelve solo el `mensaje` de la respuesta (para endpoints que no traen datos útiles). */
export function extraerMensaje<T>(peticion: Observable<ApiResponse<T>>): Observable<string> {
  return extraerDatos(peticion.pipe(map((respuesta) => ({ ...respuesta, datos: respuesta.mensaje }))));
}

/** Texto para mostrar al usuario: el `mensaje` del backend si viene; si no, `porDefecto`. */
export function mensajeError(error: unknown, porDefecto: string): string {
  if (error instanceof HttpErrorResponse) {
    const mensaje: unknown = error.error?.mensaje;
    if (typeof mensaje === 'string' && mensaje.trim()) {
      return mensaje;
    }
    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    }
    return porDefecto;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return porDefecto;
}

/** Código HTTP del error, o null si el error no vino del servidor. */
export function estadoHttp(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}

/** True si el recurso no existe (404, o `exito: false` del backend). */
export function esNoEncontrado(error: unknown): boolean {
  const estado = estadoHttp(error);
  return estado === null || estado === 404;
}
