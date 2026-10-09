import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { API_URL } from '../config/api.config';
import { ApiResponse } from '../../models/api-response.model';
import {
  ActualizarPerfilRequest,
  AuthResponse,
  LoginRequest,
  RegistroRequest,
  Rol,
  Usuario,
} from '../../models/auth.model';
import { extraerDatos, extraerMensaje } from '../http/api.util';

const CLAVE_TOKEN = 'hs_token';

function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function escribirToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(CLAVE_TOKEN, token);
    } else {
      localStorage.removeItem(CLAVE_TOKEN);
    }
  } catch {
    // Sin acceso a localStorage la sesión solo dura mientras la pestaña esté abierta.
  }
}

/** Sesión del usuario. El token se guarda solo en localStorage ("hs_token"); la contraseña nunca se guarda. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/auth`;

  readonly token = signal<string | null>(leerToken());
  readonly usuario = signal<Usuario | null>(null);
  readonly estaAutenticado = computed(() => this.token() !== null && this.usuario() !== null);
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);

  login(datos: LoginRequest): Observable<Usuario> {
    return extraerDatos(this.http.post<ApiResponse<AuthResponse>>(`${this.url}/login`, datos)).pipe(
      tap((respuesta) => this.iniciarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  registro(datos: RegistroRequest): Observable<Usuario> {
    return extraerDatos(this.http.post<ApiResponse<AuthResponse>>(`${this.url}/registro`, datos)).pipe(
      tap((respuesta) => this.iniciarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  logout(): void {
    escribirToken(null);
    this.token.set(null);
    this.usuario.set(null);
  }

  /**
   * Restaura la sesión al abrir la app: si hay token guardado lo valida con /auth/me; si falla, limpia la sesión.
   * Devuelve una Promise porque la app espera a que termine antes de mostrar la primera pantalla.
   */
  cargarSesion(): Promise<void> {
    return new Promise((terminar) => {
      if (!this.token()) {
        terminar();
        return;
      }
      extraerDatos(this.http.get<ApiResponse<Usuario>>(`${this.url}/me`)).subscribe({
        next: (usuario) => {
          this.usuario.set(usuario);
          terminar();
        },
        error: () => {
          this.logout();
          terminar();
        },
      });
    });
  }

  /** Guarda los datos del perfil (PUT /auth/me) y actualiza el usuario de la sesión con la respuesta. */
  actualizarPerfil(datos: ActualizarPerfilRequest): Observable<Usuario> {
    return extraerDatos(this.http.put<ApiResponse<Usuario>>(`${this.url}/me`, datos)).pipe(
      tap((usuario) => this.usuario.set(usuario)),
    );
  }

  /** Devuelve el mensaje genérico del backend (no revela si el correo existe). */
  olvidePassword(correo: string): Observable<string> {
    return extraerMensaje(this.http.post<ApiResponse<unknown>>(`${this.url}/olvide-password`, { correo }));
  }

  restablecerPassword(token: string, nuevaPassword: string): Observable<string> {
    return extraerMensaje(
      this.http.post<ApiResponse<unknown>>(`${this.url}/restablecer-password`, { token, nuevaPassword }),
    );
  }

  /** Pantalla a la que va cada rol después de iniciar sesión. */
  rutaInicio(returnUrl: string | null = null): string {
    switch (this.rol()) {
      case 'ADMINISTRADOR':
        return '/admin';
      case 'PUBLICADOR':
        return '/panel';
      default:
        return returnUrl && returnUrl.startsWith('/') ? returnUrl : '/catalogo';
    }
  }

  private iniciarSesion({ token, usuario }: AuthResponse): void {
    escribirToken(token);
    this.token.set(token);
    this.usuario.set(usuario);
  }
}
