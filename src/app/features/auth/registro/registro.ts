import { Component, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { RegistroRequest } from '../../../models/auth.model';
import { TipoPublicador } from '../../../models/mascota.model';
import { MUNICIPIOS_EDOMEX } from '../../../models/municipios-edomex';
import { mensajeError } from '../../../core/http/api.util';
import { LONGITUD_MINIMA_PASSWORD, passwordsCoinciden } from '../../../shared/validators/password.validators';

type RolRegistro = RegistroRequest['rol'];

/** Los publicadores deben indicar si son refugio o particular y su ubicación. */
const datosPublicadorCompletos: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  if (grupo.get('rol')?.value !== 'PUBLICADOR') {
    return null;
  }
  const errores: ValidationErrors = {};
  if (!grupo.get('tipoPublicador')?.value) {
    errores['tipoPublicadorRequerido'] = true;
  }
  if (!String(grupo.get('ubicacion')?.value ?? '').trim()) {
    errores['ubicacionRequerida'] = true;
  }
  return Object.keys(errores).length ? errores : null;
};

/** Registro de cuenta nueva (/registro), como adoptante o como publicador (refugio o particular). */
@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-registro',
  templateUrl: './registro.html',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Query param `returnUrl`: a dónde volver después de registrarse. */
  readonly returnUrl = input<string>();

  protected readonly longitudMinima = LONGITUD_MINIMA_PASSWORD;
  protected readonly municipios = MUNICIPIOS_EDOMEX;

  protected readonly formulario = this.fb.group(
    {
      rol: this.fb.control<RolRegistro>('ADOPTANTE'),
      tipoPublicador: this.fb.control<TipoPublicador | null>(null),
      nombre: ['', [Validators.required]],
      ubicacion: ['Tecámac'],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_PASSWORD)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: [passwordsCoinciden('password', 'confirmacion'), datosPublicadorCompletos] },
  );

  protected readonly verPassword = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected get esPublicador(): boolean {
    return this.formulario.controls.rol.value === 'PUBLICADOR';
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected errorDeGrupo(error: string, control: AbstractControl): boolean {
    return this.formulario.hasError(error) && control.touched;
  }

  protected elegirRol(rol: RolRegistro): void {
    this.formulario.controls.rol.setValue(rol);
  }

  protected elegirTipo(tipo: TipoPublicador): void {
    this.formulario.controls.tipoPublicador.setValue(tipo);
    this.formulario.controls.tipoPublicador.markAsTouched();
  }

  protected registrarse(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    const datos = this.formulario.getRawValue();
    const esPublicador = datos.rol === 'PUBLICADOR';
    this.auth
      .registro({
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        password: datos.password,
        telefono: datos.telefono.trim(),
        rol: datos.rol,
        tipoPublicador: esPublicador ? datos.tipoPublicador : null,
        ubicacion: esPublicador ? datos.ubicacion.trim() : null,
      })
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.auth.rutaInicio(this.returnUrl() ?? null));
        },
        error: (error: unknown) => {
          this.error.set(mensajeError(error, 'No pudimos crear tu cuenta. Inténtalo de nuevo.'));
          this.enviando.set(false);
        },
      });
  }
}
