import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pie de página global: marca, consejos de adopción responsable y "Volver arriba". */
@Component({
  imports: [RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly anio = new Date().getFullYear();

  /** Sube al inicio de la página; sin animación si el usuario prefiere menos movimiento. */
  protected volverArriba(): void {
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: sinAnimacion ? 'auto' : 'smooth' });
  }
}
