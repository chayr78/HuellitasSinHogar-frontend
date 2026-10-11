import { Directive, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';

/**
 * Agrega la clase `revelado` cuando el elemento entra en pantalla (una sola vez).
 * El contenido es visible sin JS: la animación solo se arma si hay IntersectionObserver y movimiento permitido.
 */
@Directive({
  selector: '[appRevelar]',
  host: {
    '[class.revelar-listo]': 'listo()',
    '[class.revelado]': 'revelado()',
  },
})
export class Revelar implements OnInit, OnDestroy {
  private readonly elemento = inject(ElementRef<HTMLElement>);
  private observador: IntersectionObserver | null = null;

  protected readonly listo = signal(false);
  protected readonly revelado = signal(false);

  ngOnInit(): void {
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sinMovimiento || !('IntersectionObserver' in window)) {
      return;
    }
    this.listo.set(true);
    this.observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          this.revelado.set(true);
          this.observador?.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    this.observador.observe(this.elemento.nativeElement);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
