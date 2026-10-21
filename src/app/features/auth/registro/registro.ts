import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconoHuella } from '../../../shared/components/icono-huella/icono-huella';

import { AuthService } from '../../../core/auth/auth.service';
import { REGISTRO_IMAGEN } from '../../../core/config/imagenes.config';
import { RegistroRequest } from '../../../models/auth.model';
import { TipoPublicador } from '../../../models/mascota.model';
import { MUNICIPIOS_EDOMEX } from '../../../models/municipios-edomex';
import { mensajeError } from '../../../core/http/api.util';
import { LONGITUD_MINIMA_PASSWORD, passwordsCoinciden } from '../../../shared/validators/password.validators';
import { nombreRefugioValido, nombreValido, telefonoValido } from '../../../shared/validators/texto.validators';

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

/** El nombre de un refugio puede llevar números; el de una persona, no. */
const nombreSegunCuenta: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  esRefugio(control.parent) ? nombreRefugioValido(control) : nombreValido(control);

function esRefugio(grupo: AbstractControl | null): boolean {
  return grupo?.get('rol')?.value === 'PUBLICADOR' && grupo.get('tipoPublicador')?.value === 'REFUGIO';
}

/** Registro de cuenta nueva (/registro), como adoptante o como publicador (refugio o particular). */
@Component({
  imports: [RouterLink, ReactiveFormsModule, IconoHuella],
  selector: 'app-registro',
  styleUrl: './registro.scss',
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
      nombre: ['', [Validators.required, nombreSegunCuenta]],
      ubicacion: ['Tecámac'],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, telefonoValido]],
      password: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_PASSWORD)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: [passwordsCoinciden('password', 'confirmacion'), datosPublicadorCompletos] },
  );

  protected readonly imagen = REGISTRO_IMAGEN;

  private readonly password = toSignal(this.formulario.controls.password.valueChanges, { initialValue: '' });
  /** Qué tanto se acerca la contraseña a la longitud mínima (0 a 100), para la barra de avance. */
  protected readonly avancePassword = computed(() =>
    Math.min(100, Math.round((this.password().length / LONGITUD_MINIMA_PASSWORD) * 100)),
  );

  protected readonly verPassword = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected get esPublicador(): boolean {
    return this.formulario.controls.rol.value === 'PUBLICADOR';
  }

  protected get esRefugio(): boolean {
    return esRefugio(this.formulario);
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected errorDeGrupo(error: string, control: AbstractControl): boolean {
    return this.formulario.hasError(error) && control.touched;
  }

  protected elegirRol(rol: RolRegistro): void {
    this.formulario.controls.rol.setValue(rol);
    // La regla del nombre depende del tipo de cuenta
    this.formulario.controls.nombre.updateValueAndValidity();
  }

  protected elegirTipo(tipo: TipoPublicador): void {
    this.formulario.controls.tipoPublicador.setValue(tipo);
    this.formulario.controls.tipoPublicador.markAsTouched();
    this.formulario.controls.nombre.updateValueAndValidity();
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
