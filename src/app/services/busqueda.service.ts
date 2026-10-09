import { Injectable, signal } from '@angular/core';

/** Texto del buscador del navbar, compartido con el catálogo. */
@Injectable({ providedIn: 'root' })
export class BusquedaService {
  readonly termino = signal('');
}
