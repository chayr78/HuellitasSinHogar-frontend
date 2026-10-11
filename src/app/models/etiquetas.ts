// Textos que se muestran en pantalla para cada valor del backend, y las listas de opciones. Un solo lugar para cambiarlos.
import { Rol } from './auth.model';
import { Especie, EstadoMascota, NivelEnergia, Sexo, Tamano, TipoPublicador } from './mascota.model';
import { EstadoSolicitud } from './solicitud.model';

export const ETIQUETA_ESPECIE: Record<Especie, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
};

export const ETIQUETA_SEXO: Record<Sexo, string> = {
  MACHO: 'Macho',
  HEMBRA: 'Hembra',
};

/** Ícono de Bootstrap Icons para cada sexo. */
export const ICONO_SEXO: Record<Sexo, string> = {
  MACHO: 'bi-gender-male',
  HEMBRA: 'bi-gender-female',
};

export const ETIQUETA_TAMANO: Record<Tamano, string> = {
  CHICO: 'Chico',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
};

export const ETIQUETA_ENERGIA: Record<NivelEnergia, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const ETIQUETA_ESTADO: Record<EstadoMascota, string> = {
  DISPONIBLE: 'Disponible',
  EN_PROCESO: 'En proceso',
  ADOPTADO: 'Adoptado',
};

export const CLASE_BADGE_ESTADO: Record<EstadoMascota, string> = {
  DISPONIBLE: 'hs-badge-ok',
  EN_PROCESO: 'hs-badge-warn',
  ADOPTADO: 'hs-badge-neutral',
};

export const ETIQUETA_TIPO_PUBLICADOR: Record<TipoPublicador, string> = {
  REFUGIO: 'Refugio',
  PARTICULAR: 'Particular',
};

export const ETIQUETA_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  CONTACTADA: 'Contactada',
  CERRADA: 'Cerrada',
};

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADOPTANTE: 'Adoptante',
  PUBLICADOR: 'Publicador',
  ADMINISTRADOR: 'Administrador',
};

/** Cómo ve el adoptante el estado de su solicitud. */
export const ESTADO_SOLICITUD_ADOPTANTE: Record<EstadoSolicitud, { etiqueta: string; clase: string; explicacion: string }> = {
  PENDIENTE: {
    etiqueta: 'En revisión',
    clase: 'hs-badge-neutral',
    explicacion: 'El publicador aún está revisando tu solicitud.',
  },
  CONTACTADA: {
    etiqueta: 'El refugio te contactó',
    clase: 'hs-badge-ok',
    explicacion: 'Revisa tu teléfono o correo: se comunicaron contigo para continuar con la adopción.',
  },
  CERRADA: {
    etiqueta: 'Cerrada',
    clase: 'hs-badge-warn',
    explicacion: 'Esta solicitud ya concluyó. ¡Gracias por tu interés en dar un hogar!',
  },
};

/** Plural de cada especie, para el filtro del catálogo ("Perros", "Gatos"). */
export const ETIQUETA_ESPECIE_PLURAL: Record<Especie, string> = {
  PERRO: 'Perros',
  GATO: 'Gatos',
};

// Listas de valores en el orden en que se muestran como opciones.
export const ESPECIES: Especie[] = ['PERRO', 'GATO'];
export const SEXOS: Sexo[] = ['MACHO', 'HEMBRA'];
export const TAMANOS: Tamano[] = ['CHICO', 'MEDIANO', 'GRANDE'];
export const NIVELES_ENERGIA: NivelEnergia[] = ['BAJA', 'MEDIA', 'ALTA'];
export const ESTADOS_MASCOTA: EstadoMascota[] = ['DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'];
export const ESTADOS_SOLICITUD: EstadoSolicitud[] = ['PENDIENTE', 'CONTACTADA', 'CERRADA'];
