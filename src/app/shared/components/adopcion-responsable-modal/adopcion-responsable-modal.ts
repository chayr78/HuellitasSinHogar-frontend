import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Aviso de adopción responsable que se muestra antes del formulario de solicitud.
 * Se cierra con close() al continuar y con dismiss() al cancelar.
 */
@Component({
  imports: [],
  selector: 'app-adopcion-responsable-modal',
  templateUrl: './adopcion-responsable-modal.html',
})
export class AdopcionResponsableModal {
  protected readonly activeModal = inject(NgbActiveModal);
  protected readonly aceptado = signal(false);

  protected alMarcar(evento: Event): void {
    this.aceptado.set((evento.target as HTMLInputElement).checked);
  }
}
