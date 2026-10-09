export type EstadoSolicitud = 'PENDIENTE' | 'CONTACTADA' | 'CERRADA';
export type TipoVivienda = 'DEPTO_SIN_PATIO' | 'PATIO_PEQUENO' | 'PATIO_GRANDE';
export type HorasDisponibles = 'MENOS_2H' | 'DE_2_A_5H' | 'MAS_5H';

export interface SolicitudResponse {
  id: number;
  mascotaId: number;
  mascotaNombre: string;
  mascotaFotoUrl: string | null;
  publicadorNombre: string;
  adoptanteId: number;
  nombreContacto: string;
  telefonoContacto: string;
  correoContacto: string;
  mensaje: string | null;
  estado: EstadoSolicitud;
  fechaSolicitud: string;
  tipoVivienda: TipoVivienda | null;
  horasDisponibles: HorasDisponibles | null;
  experienciaPrevia: boolean | null;
  ninosPequenos: boolean | null;
  otrasMascotas: boolean | null;
  porcentajeCompatibilidad: number | null;
  leidaPublicador: boolean;
  leidaAdoptante: boolean;
  adoptanteNombre: string;
  adoptanteFotoUrl: string | null;
}

/** Cuerpo de POST /solicitudes. El adoptante se toma del token. */
export interface SolicitudRequest {
  mascotaId: number;
  nombreContacto: string;
  telefonoContacto: string;
  correoContacto: string;
  mensaje: string | null;
  tipoVivienda: TipoVivienda | null;
  horasDisponibles: HorasDisponibles | null;
  experienciaPrevia: boolean | null;
  ninosPequenos: boolean | null;
  otrasMascotas: boolean | null;
}

/** Respuestas de la encuesta de compatibilidad (se guardan para la solicitud). */
export interface RespuestasEncuesta {
  tipoVivienda: TipoVivienda;
  horasDisponibles: HorasDisponibles;
  experienciaPrevia: boolean;
  ninosPequenos: boolean;
  otrasMascotas: boolean;
}

export interface CompatibilidadRequest {
  mascotaId: number;
  tipoVivienda: TipoVivienda;
  horasDisponibles: HorasDisponibles;
}

export interface ResultadoCompatibilidad {
  porcentaje: number;
  advertencia: boolean;
}
