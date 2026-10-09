import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error';

export interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

/** Avisos breves que se muestran en la esquina superior derecha (ver ToastContainer). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(texto: string): void {
    this.agregar('exito', texto);
  }

  error(texto: string): void {
    this.agregar('error', texto);
  }

  quitar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private agregar(tipo: TipoToast, texto: string): void {
    this.toasts.update((lista) => [...lista, { id: this.siguienteId++, tipo, texto }]);
  }
}
