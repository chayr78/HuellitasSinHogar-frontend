import { Component, input } from '@angular/core';

/** Bloque peach con 🐾 centrado, para mascotas sin foto o cuya imagen no cargó. El tamaño lo define el contenedor. */
@Component({
  imports: [],
  selector: 'app-mascota-placeholder',
  styleUrl: './mascota-placeholder.scss',
  templateUrl: './mascota-placeholder.html',
  host: {
    role: 'img',
    '[attr.aria-label]': 'etiqueta()',
  },
})
export class MascotaPlaceholder {
  readonly etiqueta = input('Mascota sin foto');
}
