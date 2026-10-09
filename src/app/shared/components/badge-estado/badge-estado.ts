import { Component, input } from '@angular/core';

import { CLASE_BADGE_ESTADO, ETIQUETA_ESTADO } from '../../../models/etiquetas';
import { EstadoMascota } from '../../../models/mascota.model';

/**
 * Badge con el estado de una mascota ("Disponible", "En proceso", "Adoptado").
 * Se usa sobre un <span>: <span appBadgeEstado [estado]="m.estado"></span>, así el HTML queda igual que antes.
 */
@Component({
  selector: 'span[appBadgeEstado]',
  template: '{{ etiquetas[estado()] }}',
  host: { '[class]': 'clases[estado()]' },
})
export class BadgeEstado {
  readonly estado = input.required<EstadoMascota>();

  protected readonly etiquetas = ETIQUETA_ESTADO;
  protected readonly clases = CLASE_BADGE_ESTADO;
}
