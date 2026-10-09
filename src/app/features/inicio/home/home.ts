import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NavbarEstadoService } from '../../../core/services/navbar-estado.service';
import { MascotaResponse } from '../../../models/mascota.model';
import { MascotaService } from '../../../services/mascota.service';
import { MascotaCard } from '../../../shared/components/mascota-card/mascota-card';
import { HeroInicio } from '../hero-inicio/hero-inicio';

/** Un paso de "Así de fácil". */
interface Paso {
  icono: string;
  texto: string;
}

/** Página de inicio (/): banner, misión, cómo funciona, mascotas destacadas e invitación a publicar. */
@Component({
  imports: [RouterLink, HeroInicio, MascotaCard],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  private readonly mascotaService = inject(MascotaService);
  private readonly navbarEstado = inject(NavbarEstadoService);
  protected readonly auth = inject(AuthService);

  /** Disponibles; null mientras carga o si falló. */
  protected readonly disponibles = signal<MascotaResponse[] | null>(null);
  protected readonly cargandoDisponibles = signal(true);
  /** Total de adoptadas; null mientras carga o si falló. */
  protected readonly totalAdoptados = signal<number | null>(null);

  protected readonly pasos: Paso[] = [
    { icono: 'bi-search', texto: 'Explora el catálogo' },
    { icono: 'bi-clipboard2-check', texto: 'Descubre tu compatibilidad (opcional)' },
    { icono: 'bi-send', texto: 'Envía tu solicitud' },
    { icono: 'bi-chat-heart', texto: 'El refugio te contacta' },
  ];

  ngOnInit(): void {
    // El navbar se coloca transparente encima del banner mientras esta página está abierta.
    this.navbarEstado.sobreBanner.set(true);

    // Las dos llamadas se hacen una sola vez y sus datos se comparten con las secciones.
    this.mascotaService.obtenerDisponibles().subscribe({
      next: (mascotas) => {
        this.disponibles.set(mascotas);
        this.cargandoDisponibles.set(false);
      },
      error: () => this.cargandoDisponibles.set(false),
    });
    this.mascotaService.obtenerAdoptados().subscribe({
      next: (mascotas) => this.totalAdoptados.set(mascotas.length),
      error: () => undefined, // Sin el conteo, el banner simplemente no muestra la insignia.
    });
  }

  ngOnDestroy(): void {
    this.navbarEstado.sobreBanner.set(false);
  }

  /** Las primeras 3 disponibles para "Conoce a algunas mascotas". */
  protected destacadas(): MascotaResponse[] {
    return (this.disponibles() ?? []).slice(0, 3);
  }

  /** La invitación a publicar es para visitantes sin sesión y publicadores. */
  protected mostrarInvitacion(): boolean {
    const rol = this.auth.rol();
    return rol === null || rol === 'PUBLICADOR';
  }

  protected destinoPublicar(): string {
    return this.auth.rol() === 'PUBLICADOR' ? '/panel/nueva' : '/registro';
  }
}
