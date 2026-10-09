import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeError } from '../../../core/http/api.util';
import { ETIQUETA_ROL, ETIQUETA_TIPO_PUBLICADOR } from '../../../models/etiquetas';
import { MUNICIPIOS_EDOMEX } from '../../../models/municipios-edomex';
import { ToastService } from '../../../services/toast.service';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { FotoUploader } from '../../../shared/components/foto-uploader/foto-uploader';

/** "Mi perfil" (/perfil): foto, nombre, teléfono y municipio del usuario con sesión iniciada. */
@Component({
  imports: [ReactiveFormsModule, Avatar, FotoUploader],
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** La ruta tiene authGuard, así que siempre hay usuario. */
  protected readonly usuario = this.auth.usuario;

  protected readonly formulario = this.fb.group({
    fotoPerfilUrl: this.fb.control<string | null>(this.usuario()?.fotoPerfilUrl ?? null),
    nombre: [this.usuario()?.nombre ?? '', [Validators.required]],
    telefono: [this.usuario()?.telefono ?? '', [Validators.required]],
    ubicacion: [this.usuario()?.ubicacion ?? ''],
  });

  protected readonly municipios = MUNICIPIOS_EDOMEX;
  /** Ubicación guardada que no es un municipio de la lista (cuentas antiguas); se ofrece para no perderla. */
  protected readonly ubicacionAnterior = this.ubicacionFueraDeLista();

  protected readonly guardando = signal(false);
  protected readonly subiendoFoto = signal(false);
  protected readonly error = signal<string | null>(null);

  /** "Refugio" o "Particular" para publicadores; el rol para los demás. */
  protected tipoCuenta(): string {
    const usuario = this.usuario();
    if (!usuario) {
      return '';
    }
    if (usuario.rol === 'PUBLICADOR' && usuario.tipoPublicador) {
      return ETIQUETA_TIPO_PUBLICADOR[usuario.tipoPublicador];
    }
    return ETIQUETA_ROL[usuario.rol];
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.guardando() || this.subiendoFoto()) {
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    const datos = this.formulario.getRawValue();
    this.auth
      .actualizarPerfil({
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        ubicacion: datos.ubicacion.trim() || null,
        fotoPerfilUrl: datos.fotoPerfilUrl,
      })
      .subscribe({
        next: () => {
          this.toast.success('Perfil actualizado');
          this.formulario.markAsPristine();
          this.guardando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeError(error, 'No pudimos guardar tu perfil. Inténtalo de nuevo.'));
          this.guardando.set(false);
        },
      });
  }

  private ubicacionFueraDeLista(): string | null {
    const actual = this.usuario()?.ubicacion?.trim();
    return actual && !MUNICIPIOS_EDOMEX.includes(actual) ? actual : null;
  }
}
