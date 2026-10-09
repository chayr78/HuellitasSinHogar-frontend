import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmDialog, OpcionesConfirmacion } from '../shared/components/confirm-dialog/confirm-dialog';

/** Abre el modal de confirmación (ConfirmDialog) y devuelve si el usuario aceptó. */
/** Abre el modal de confirmación (ConfirmDialog) y devuelve si el usuario aceptó. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NgbModal);

  /** Abre un modal de confirmación. Resuelve true si el usuario confirma y false si cancela o cierra. */
  confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    const ref = this.modal.open(ConfirmDialog, { centered: true, ariaLabelledBy: 'titulo-confirmacion' });
    const dialogo: ConfirmDialog = ref.componentInstance;
    dialogo.configurar(opciones);
    return ref.result.then(
      () => true,
      () => false,
    );
  }
}
