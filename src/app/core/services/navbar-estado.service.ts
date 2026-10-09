import { Injectable, signal } from '@angular/core';

/** Estado compartido del navbar. Inicio activa `sobreBanner` para que el navbar quede encima de su banner. */
@Injectable({ providedIn: 'root' })
export class NavbarEstadoService {
  readonly sobreBanner = signal(false);
}
