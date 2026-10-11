import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { IconoHuella } from '../icono-huella/icono-huella';

/** Pie de página global: marca, enlaces, consejos de adopción responsable y "Volver arriba". */
@Component({
  imports: [RouterLink, IconoHuella],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly auth = inject(AuthService);
  protected readonly anio = new Date().getFullYear();

  /** Sube al inicio de la página; sin animación si el usuario prefiere menos movimiento. */
  protected volverArriba(): void {
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: sinAnimacion ? 'auto' : 'smooth' });
  }
}
