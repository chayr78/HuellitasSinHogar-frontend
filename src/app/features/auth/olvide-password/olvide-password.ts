import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeError } from '../../../core/http/api.util';

/** Pide el correo para enviar el enlace de recuperación de contraseña (/olvide-password). */
@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-olvide-password',
  templateUrl: './olvide-password.html',
})
export class OlvidePassword {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formulario = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  protected readonly enviando = signal(false);
  /** Mensaje genérico del backend; no revela si el correo existe. */
  protected readonly confirmacion = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.auth.olvidePassword(this.formulario.controls.correo.value.trim()).subscribe({
      next: (mensaje) => {
        this.confirmacion.set(mensaje);
        this.enviando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No pudimos procesar tu solicitud. Inténtalo de nuevo.'));
        this.enviando.set(false);
      },
    });
  }
}
