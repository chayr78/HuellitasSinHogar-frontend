import { TipoPublicador } from './mascota.model';

export type Rol = 'PUBLICADOR' | 'ADOPTANTE' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
  tipoPublicador: TipoPublicador | null;
  ubicacion: string | null;
  activo: boolean;
  fechaRegistro: string;
  fotoPerfilUrl: string | null;
}

/** Cuerpo de PUT /auth/me. */
export interface ActualizarPerfilRequest {
  nombre: string;
  telefono: string;
  ubicacion: string | null;
  fotoPerfilUrl: string | null;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  correo: string;
  password: string;
  telefono: string;
  rol: Exclude<Rol, 'ADMINISTRADOR'>;
  tipoPublicador: TipoPublicador | null;
  ubicacion: string | null;
}
