import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeError } from '../../../core/http/api.util';

/** Inicio de sesión (/login). Al entrar lleva a cada rol a su pantalla de inicio o a returnUrl. */
@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Query param `returnUrl`: a dónde volver después de iniciar sesión. */
  readonly returnUrl = input<string>();

  protected readonly formulario = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly verPassword = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected entrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    const { correo, password } = this.formulario.getRawValue();
    this.auth.login({ correo: correo.trim(), password }).subscribe({
      next: () => {
        this.router.navigateByUrl(this.auth.rutaInicio(this.returnUrl() ?? null));
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No pudimos iniciar sesión. Inténtalo de nuevo.'));
        this.enviando.set(false);
      },
    });
  }
}
