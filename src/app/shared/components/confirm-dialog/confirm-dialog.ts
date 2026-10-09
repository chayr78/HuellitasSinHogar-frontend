import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Resalta el botón de confirmar como acción destructiva. */
  peligro?: boolean;
}

/** Modal de confirmación. Se abre desde ConfirmService. */
@Component({
  imports: [],
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  protected readonly activeModal = inject(NgbActiveModal);
  protected readonly opciones = signal<Required<OpcionesConfirmacion>>({
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    peligro: false,
  });

  configurar(opciones: OpcionesConfirmacion): void {
    this.opciones.update((actuales) => ({ ...actuales, ...opciones }));
  }
}
