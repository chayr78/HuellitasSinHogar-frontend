import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ETIQUETA_ENERGIA, ETIQUETA_SEXO, ETIQUETA_TAMANO, ICONO_SEXO } from '../../../models/etiquetas';
import { MascotaResponse } from '../../../models/mascota.model';
import { BadgeEstado } from '../badge-estado/badge-estado';
import { FotoMascota } from '../foto-mascota/foto-mascota';

/** Tarjeta de una mascota para las cuadrículas del catálogo y de adoptados. Al hacer clic abre su detalle. */
@Component({
  imports: [RouterLink, FotoMascota, BadgeEstado],
  selector: 'app-mascota-card',
  styleUrl: './mascota-card.scss',
  templateUrl: './mascota-card.html',
})
export class MascotaCard {
  readonly mascota = input.required<MascotaResponse>();
  /** "adoptado" muestra el badge "¡Adoptado!" y el pie en tono durazno. */
  readonly variante = input<'catalogo' | 'adoptado'>('catalogo');

  protected readonly etiquetaTamano = ETIQUETA_TAMANO;
  protected readonly etiquetaEnergia = ETIQUETA_ENERGIA;
  protected readonly etiquetaSexo = ETIQUETA_SEXO;
  protected readonly iconoSexo = ICONO_SEXO;
}
