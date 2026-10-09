import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeError } from '../../../core/http/api.util';
import { ToastService } from '../../../services/toast.service';
import { LONGITUD_MINIMA_PASSWORD, passwordsCoinciden } from '../../../shared/validators/password.validators';

/** Nueva contraseña (/restablecer?token=...), desde el enlace que llega por correo. */
@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-restablecer-password',
  templateUrl: './restablecer-password.html',
})
export class RestablecerPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Query param `token` del enlace recibido por correo. */
  readonly token = input<string>();

  protected readonly longitudMinima = LONGITUD_MINIMA_PASSWORD;

  protected readonly formulario = this.fb.group(
    {
      nuevaPassword: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_PASSWORD)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: passwordsCoinciden('nuevaPassword', 'confirmacion') },
  );

  protected readonly verPassword = signal(false);
  protected readonly enviando = signal(false);
  /** Mensaje del backend cuando el token es inválido o expiró. */
  protected readonly errorToken = signal<string | null>(null);

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected confirmacionInvalida(): boolean {
    const control = this.formulario.controls.confirmacion;
    return control.touched && (control.invalid || this.formulario.hasError('passwordsDistintas'));
  }

  protected guardar(): void {
    const token = this.token();
    if (!token || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.errorToken.set(null);

    this.auth.restablecerPassword(token, this.formulario.controls.nuevaPassword.value).subscribe({
      next: () => {
        this.toast.success('Tu contraseña se actualizó. Ya puedes iniciar sesión.');
        this.router.navigateByUrl('/login');
      },
      error: (error: unknown) => {
        this.errorToken.set(mensajeError(error, 'El enlace no es válido o ya expiró.'));
        this.enviando.set(false);
      },
    });
  }
}
