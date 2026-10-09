import { Component, booleanAttribute, computed, input, signal } from '@angular/core';

import { MascotaPlaceholder } from '../mascota-placeholder/mascota-placeholder';

/**
 * Foto de una mascota que se ve COMPLETA (object-fit: contain) sobre un fondo con la misma foto desenfocada.
 * La caja siempre mide lo mismo: `altura` en px, o `proporcion` (p. ej. '1 / 1') si se indica.
 * Con `altura` en null, el tamaño lo pone el contenedor. `recortar` llena la caja recortando (miniaturas).
 * Si no hay URL o la imagen no carga, muestra el placeholder 🐾.
 */
@Component({
  imports: [MascotaPlaceholder],
  selector: 'app-foto-mascota',
  styleUrl: './foto-mascota.scss',
  templateUrl: './foto-mascota.html',
  host: {
    '[style.height.px]': 'proporcion() ? null : altura()',
    '[style.aspect-ratio]': 'proporcion()',
  },
})
export class FotoMascota {
  readonly fotoUrl = input<string | null>(null);
  /** Nombre de la mascota, para el texto alternativo. */
  readonly nombre = input.required<string>();
  /** Alto de la caja en px (220 por defecto). */
  readonly altura = input<number | null>(220);
  /** Proporción opcional, por ejemplo '1 / 1' o '4 / 3'. Si viene, reemplaza a la altura. */
  readonly proporcion = input<string | null>(null);
  /** Llena la caja recortando la foto, sin fondo desenfocado (para miniaturas). */
  readonly recortar = input(false, { transform: booleanAttribute });
  /** Texto alternativo propio; si no viene, se usa "Foto de {nombre}". */
  readonly alt = input<string | null>(null);
  /** 'eager' para la primera foto visible; 'lazy' (por defecto) para las demás. */
  readonly carga = input<'lazy' | 'eager'>('lazy');

  /** URL que no se pudo cargar; si cambia la URL, se vuelve a intentar. */
  private readonly urlFallida = signal<string | null>(null);

  protected readonly textoAlt = computed(() => this.alt() ?? `Foto de ${this.nombre()}`);

  /** Valor CSS del fondo desenfocado. Las comillas se escapan para que la URL no rompa el CSS. */
  protected readonly fondo = computed(() => `url("${(this.fotoUrl() ?? '').replace(/"/g, '%22')}")`);

  protected mostrarFoto(): boolean {
    const url = this.fotoUrl();
    return !!url?.trim() && url !== this.urlFallida();
  }

  protected alFallar(): void {
    this.urlFallida.set(this.fotoUrl());
  }
}
