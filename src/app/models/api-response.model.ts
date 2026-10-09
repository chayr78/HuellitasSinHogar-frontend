/** Envoltorio común de todas las respuestas del backend. */
export interface ApiResponse<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
}
