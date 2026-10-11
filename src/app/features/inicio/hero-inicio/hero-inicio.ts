import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HERO_IMAGEN } from '../../../core/config/imagenes.config';
import { MascotaResponse } from '../../../models/mascota.model';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';
import { MascotaPlaceholder } from '../../../shared/components/mascota-placeholder/mascota-placeholder';

const VELOCIDAD_PARALLAX = 0.12;

/**
 * Banner de Inicio a todo el ancho: título, conteos, botón al catálogo y un abanico con fotos de mascotas reales.
 * Parallax: al hacer scroll el abanico baja más lento que la página.
 */
@Component({
  imports: [RouterLink, FotoMascota, MascotaPlaceholder],
  selector: 'app-hero-inicio',
  styleUrl: './hero-inicio.scss',
  templateUrl: './hero-inicio.html',
})
export class HeroInicio implements AfterViewInit, OnDestroy {
  /** Mascotas disponibles y adoptadas; null mientras cargan o si fallan (no se muestra la insignia). */
  @Input() disponibles: number | null = null;
  @Input() adoptados: number | null = null;
  /** Hasta 3 mascotas para el abanico de fotos; vacío mientras cargan (se ve la foto del banner). */
  @Input() mascotas: MascotaResponse[] = [];

  @ViewChild('banner') private banner!: ElementRef<HTMLElement>;
  @ViewChild('capa') private capa!: ElementRef<HTMLElement>;

  protected readonly imagen = HERO_IMAGEN;
  /** Si la imagen no carga, se ve el degradado cálido de respaldo. */
  protected readonly imagenFallo = signal(false);

  private cuadro = 0;
  private ultimoDesplazamiento = -1;
  /** Se guarda la función para poder quitar el listener al destruir el componente. */
  private readonly alHacerScroll = () => this.pedirCuadro();

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // Banner estático para quien prefiere menos movimiento.
    }
    // passive: el navegador no espera al listener para hacer scroll.
    window.addEventListener('scroll', this.alHacerScroll, { passive: true });
    this.moverCapa();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.alHacerScroll);
    cancelAnimationFrame(this.cuadro);
  }

  /** Lleva a la sección siguiente con scroll suave (o directo si se prefiere menos movimiento). */
  protected irASiguiente(): void {
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('que-buscamos')?.scrollIntoView({ behavior: sinAnimacion ? 'auto' : 'smooth' });
  }

  /** Agrupa los eventos de scroll en un solo cambio por cuadro de pantalla. */
  private pedirCuadro(): void {
    if (this.cuadro === 0) {
      this.cuadro = requestAnimationFrame(() => {
        this.cuadro = 0;
        this.moverCapa();
      });
    }
  }

  /** Escribe el transform directamente en el elemento (sin signals ni detección de cambios). */
  private moverCapa(): void {
    // Pasada la altura del banner ya no se ve: el valor se queda fijo y no se vuelve a escribir.
    const desplazamiento = Math.min(window.scrollY, this.banner.nativeElement.offsetHeight);
    if (desplazamiento === this.ultimoDesplazamiento) {
      return;
    }
    this.ultimoDesplazamiento = desplazamiento;
    this.capa.nativeElement.style.transform = `translate3d(0, ${desplazamiento * VELOCIDAD_PARALLAX}px, 0)`;
  }
}
