import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Params, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  NgbCollapse,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../../core/auth/auth.service';
import { NavbarEstadoService } from '../../../core/services/navbar-estado.service';
import { ETIQUETA_ROL } from '../../../models/etiquetas';
import { NotificacionItem } from '../../../models/notificacion.model';
import { NotificacionService } from '../../../services/notificacion.service';
import { Avatar } from '../avatar/avatar';
import { IconoHuella } from '../icono-huella/icono-huella';

/** Desde cuántos px de scroll el navbar sobre el banner se vuelve sólido. */
const UMBRAL_SCROLL_PX = 24;

/** Barra superior: logo, enlaces, menú del usuario y campana de notificaciones. Siempre está visible. */
@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    DatePipe,
    NgbCollapse,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    Avatar,
    IconoHuella,
  ],
  selector: 'app-navbar',
  styleUrl: './navbar.scss',
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly notificaciones = inject(NotificacionService);

  protected readonly navbarEstado = inject(NavbarEstadoService);

  protected readonly colapsado = signal(true);
  /** True cuando la página bajó más de 24 px. */
  protected readonly scrolled = signal(false);
  protected readonly etiquetaRol = ETIQUETA_ROL;

  /** A dónde lleva una notificación según el rol. */
  protected destinoNotificaciones(): string {
    return this.auth.rol() === 'PUBLICADOR' ? '/panel' : '/mis-solicitudes';
  }

  /**
   * Datos que viajan en la URL para que la página destino abra o resalte la solicitud:
   * el panel necesita la mascota (para abrir su modal) y la solicitud; Mis solicitudes, solo la solicitud.
   */
  protected parametrosNotificacion(item: NotificacionItem): Params {
    if (this.auth.rol() === 'PUBLICADOR') {
      return { mascota: item.mascotaId, solicitud: item.solicitudId };
    }
    return { solicitud: item.solicitudId };
  }

  constructor() {
    // Cierra el menú móvil después de navegar.
    this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) {
        this.colapsado.set(true);
      }
    });

    // `scrolled` solo cambia al cruzar el umbral, así no hay trabajo extra en cada evento de scroll.
    const alHacerScroll = () => {
      const pasoUmbral = window.scrollY > UMBRAL_SCROLL_PX;
      if (pasoUmbral !== this.scrolled()) {
        this.scrolled.set(pasoUmbral);
      }
    };
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    alHacerScroll();
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', alHacerScroll));
  }

  /** Transparente solo sobre el banner de Inicio, arriba del todo y con el menú móvil cerrado. */
  protected transparente(): boolean {
    return this.navbarEstado.sobreBanner() && !this.scrolled() && this.colapsado();
  }

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
