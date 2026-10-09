import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';

import { FotoMascota } from '../foto-mascota/foto-mascota';

/**
 * Carrusel de fotos hecho solo con CSS scroll-snap: se desliza con el dedo, el trackpad o Shift + rueda.
 * Con más de una foto muestra flechas, contador y miniaturas. Con 0 o 1 foto se ve como una foto normal.
 */
@Component({
  imports: [FotoMascota],
  selector: 'app-carrusel-fotos',
  styleUrl: './carrusel-fotos.scss',
  templateUrl: './carrusel-fotos.html',
})
export class CarruselFotos {
  /** URLs de las fotos, con la portada primero. Al cambiar la lista se vuelve a la primera foto. */
  @Input() set fotos(valor: string[]) {
    this.lista.set(valor);
    this.indice.set(0);
    this.pista?.nativeElement.scrollTo({ left: 0, behavior: 'auto' });
  }
  @Input() nombre = '';
  @Input() proporcion = '1 / 1';

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;

  protected readonly lista = signal<string[]>([]);
  /** Foto visible (empieza en 0). */
  protected readonly indice = signal(0);

  /** Al deslizar, calcula qué foto quedó a la vista. */
  protected alDesplazar(): void {
    const pista = this.pista?.nativeElement;
    if (pista && pista.clientWidth > 0) {
      this.indice.set(Math.round(pista.scrollLeft / pista.clientWidth));
    }
  }

  /** Lleva el carrusel a la foto `i`. */
  protected irA(i: number): void {
    const pista = this.pista?.nativeElement;
    if (!pista || i < 0 || i >= this.lista().length) {
      return;
    }
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pista.scrollTo({ left: i * pista.clientWidth, behavior: sinAnimacion ? 'auto' : 'smooth' });
    this.indice.set(i);
  }

  /** Flechas del teclado cuando el carrusel tiene el foco. */
  protected alTeclear(evento: Event, paso: number): void {
    evento.preventDefault();
    this.irA(this.indice() + paso);
  }
}
