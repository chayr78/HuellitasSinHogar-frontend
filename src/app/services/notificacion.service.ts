import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { AuthService } from '../core/auth/auth.service';
import { API_URL } from '../core/config/api.config';
import { extraerDatos } from '../core/http/api.util';
import { ApiResponse } from '../models/api-response.model';
import { ResumenNotificaciones } from '../models/notificacion.model';

const INTERVALO_MS = 60_000;

/**
 * Notificaciones de la campana. Con sesión iniciada se consultan al entrar, cada 60 s,
 * después de cada navegación y cuando alguien llama a refrescar(). Al cerrar sesión se detienen.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly resumen = signal<ResumenNotificaciones | null>(null);

  private intervalo: ReturnType<typeof setInterval> | null = null;
  /** Consulta en curso; si llega otra, se cancela la anterior. */
  private consulta: Subscription | null = null;

  constructor() {
    // Arranca o detiene la consulta periódica cuando se inicia o se cierra sesión.
    // untracked: el effect solo debe reaccionar a estaAutenticado, no a lo que se lea dentro de iniciar().
    effect(() => {
      const conSesion = this.auth.estaAutenticado();
      untracked(() => {
        if (conSesion) {
          this.iniciar();
        } else {
          this.detener();
        }
      });
    });

    this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) {
        this.refrescar();
      }
    });
  }

  noLeidas(): number {
    return this.resumen()?.noLeidas ?? 0;
  }

  items(): ResumenNotificaciones['items'] {
    return this.resumen()?.items ?? [];
  }

  refrescar(): void {
    if (!this.auth.estaAutenticado()) {
      return;
    }
    this.consulta?.unsubscribe();
    this.consulta = this.obtenerResumen().subscribe({
      next: (resumen) => this.resumen.set(resumen),
      error: () => {}, // Si falla, se deja el último resumen y se reintenta en la próxima consulta.
    });
  }

  obtenerResumen(): Observable<ResumenNotificaciones> {
    return extraerDatos(this.http.get<ApiResponse<ResumenNotificaciones>>(`${API_URL}/notificaciones/resumen`));
  }

  private iniciar(): void {
    this.detener();
    this.refrescar();
    this.intervalo = setInterval(() => this.refrescar(), INTERVALO_MS);
  }

  private detener(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    this.consulta?.unsubscribe();
    this.resumen.set(null);
  }
}
