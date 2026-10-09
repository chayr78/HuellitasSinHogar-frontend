import { Component, inject } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '../../../services/toast.service';

/** Muestra los avisos de ToastService en la esquina superior derecha. */
@Component({
  imports: [NgbToast],
  selector: 'app-toast-container',
  styleUrl: './toast-container.scss',
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
