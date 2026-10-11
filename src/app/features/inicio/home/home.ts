import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NavbarEstadoService } from '../../../core/services/navbar-estado.service';
import { MascotaResponse } from '../../../models/mascota.model';
import { MascotaService } from '../../../services/mascota.service';
import { IconoHuella } from '../../../shared/components/icono-huella/icono-huella';
import { MascotaCard } from '../../../shared/components/mascota-card/mascota-card';
import { Revelar } from '../../../shared/directives/revelar';
import { HeroInicio } from '../hero-inicio/hero-inicio';

/** Un paso de "Así de fácil". */
interface Paso {
  icono: string;
  titulo: string;
  texto: string;
}

/** Página de inicio (/): banner, misión, cómo funciona, mascotas destacadas e invitación a publicar. */
@Component({
  imports: [RouterLink, HeroInicio, MascotaCard, IconoHuella, Revelar],
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
    { icono: 'bi-search', titulo: 'Explora el catálogo', texto: 'Filtra por especie y tamaño y conoce la historia de cada mascota.' },
    {
      icono: 'bi-clipboard2-check',
      titulo: 'Descubre tu compatibilidad',
      texto: 'Una encuesta breve y opcional te dice qué tan bien encaja con tu hogar.',
    },
    { icono: 'bi-send', titulo: 'Envía tu solicitud', texto: 'Llénala desde la ficha de la mascota que te robó el corazón.' },
    {
      icono: 'bi-chat-heart',
      titulo: 'El refugio te contacta',
      texto: 'Quien la publicó revisa tu solicitud y se comunica contigo para continuar.',
    },
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
