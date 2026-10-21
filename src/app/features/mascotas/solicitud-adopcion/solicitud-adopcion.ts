import { Component, Input, OnDestroy, inject, numberAttribute, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../../core/auth/auth.service';
import { esNoEncontrado, estadoHttp, mensajeError } from '../../../core/http/api.util';
import { MascotaResponse } from '../../../models/mascota.model';
import { EncuestaStateService } from '../../../services/encuesta-state.service';
import { MascotaService } from '../../../services/mascota.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { ToastService } from '../../../services/toast.service';
import { AdopcionResponsableModal } from '../../../shared/components/adopcion-responsable-modal/adopcion-responsable-modal';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';
import { nombreValido, telefonoValido } from '../../../shared/validators/texto.validators';

/**
 * Formulario de solicitud de adopción (/mascotas/:id/solicitud). Envía los datos de contacto
 * y, si el adoptante hizo la encuesta de esta mascota, también sus respuestas.
 */
@Component({
  imports: [RouterLink, ReactiveFormsModule, FotoMascota],
  selector: 'app-solicitud-adopcion',
  styleUrl: './solicitud-adopcion.scss',
  templateUrl: './solicitud-adopcion.html',
})
export class SolicitudAdopcion implements OnDestroy {
  private readonly mascotaService = inject(MascotaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly encuestaState = inject(EncuestaStateService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly modal = inject(NgbModal);
  private readonly router = inject(Router);

  /** Parámetro `:id` de la ruta. */
  @Input({ required: true, transform: numberAttribute }) set id(valor: number) {
    this.mascotaId = valor;
    this.cargarMascota();
  }
  private mascotaId = 0;

  protected readonly mascota = signal<MascotaResponse | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly noEncontrada = signal(false);
  /** El formulario solo se muestra después de aceptar el aviso de adopción responsable. */
  protected readonly aceptoAdopcion = signal(false);
  private avisoAbierto: NgbModalRef | null = null;

  ngOnDestroy(): void {
    // Si el usuario sale de la página con el aviso abierto, se cierra sin navegar.
    const ref = this.avisoAbierto;
    this.avisoAbierto = null;
    ref?.dismiss();
  }

  // Se rellena con los datos de la cuenta; el adoptante puede cambiarlos para esta solicitud.
  protected readonly formulario = this.fb.group({
    nombreContacto: [this.auth.usuario()?.nombre ?? '', [Validators.required, nombreValido]],
    telefonoContacto: [this.auth.usuario()?.telefono ?? '', [Validators.required, telefonoValido]],
    correoContacto: [this.auth.usuario()?.correo ?? '', [Validators.required, Validators.email]],
    mensaje: [''],
  });

  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  /** El backend respondió 409: ya hay una solicitud de este adoptante para esta mascota. */
  protected readonly errorDuplicada = signal(false);
  protected readonly avisoSolicitudActiva = signal(false);
  /** Resultado del envío. Guarda el porcentaje porque la encuesta se borra al enviar. */
  protected readonly enviada = signal<{ porcentaje: number | null } | null>(null);

  /** Porcentaje de la encuesta, si el usuario la hizo para esta mascota. */
  protected porcentajeEncuesta(): number | null {
    return this.encuestaState.porcentajePara(this.mascotaId);
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  /** Antes de enviar, avisa si el adoptante ya tiene otra solicitud activa. */
  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.errorDuplicada.set(false);

    this.solicitudService.tieneSolicitudActiva().subscribe({
      next: (tieneActiva) => {
        if (tieneActiva) {
          this.enviando.set(false);
          this.avisoSolicitudActiva.set(true);
        } else {
          this.crearSolicitud();
        }
      },
      // Si la verificación falla no bloqueamos al usuario: el aviso es solo informativo.
      error: () => this.crearSolicitud(),
    });
  }

  protected cancelarAviso(): void {
    this.avisoSolicitudActiva.set(false);
  }

  protected enviarDeTodosModos(): void {
    this.avisoSolicitudActiva.set(false);
    this.enviando.set(true);
    this.crearSolicitud();
  }

  private crearSolicitud(): void {
    const mascotaId = this.mascotaId;
    const datos = this.formulario.getRawValue();
    const encuesta = this.encuestaState.respuestasPara(mascotaId);
    const porcentaje = this.encuestaState.porcentajePara(mascotaId);

    const solicitud = {
      mascotaId,
      nombreContacto: datos.nombreContacto.trim(),
      telefonoContacto: datos.telefonoContacto.trim(),
      correoContacto: datos.correoContacto.trim(),
      mensaje: datos.mensaje.trim() || null,
      tipoVivienda: encuesta?.tipoVivienda ?? null,
      horasDisponibles: encuesta?.horasDisponibles ?? null,
      experienciaPrevia: encuesta?.experienciaPrevia ?? null,
      ninosPequenos: encuesta?.ninosPequenos ?? null,
      otrasMascotas: encuesta?.otrasMascotas ?? null,
    };
    this.solicitudService.crear(solicitud).subscribe({
      next: () => {
        this.encuestaState.limpiar();
        this.enviada.set({ porcentaje });
        this.enviando.set(false);
        this.toast.success('¡Tu solicitud fue enviada!');
        this.notificaciones.refrescar();
      },
      error: (error: unknown) => {
        this.errorDuplicada.set(estadoHttp(error) === 409);
        this.errorEnvio.set(mensajeError(error, this.mensajeErrorEnvio(estadoHttp(error))));
        this.enviando.set(false);
      },
    });
  }

  /** Mensaje por defecto según el código HTTP (si el backend no manda uno). */
  private mensajeErrorEnvio(estado: number | null): string {
    if (estado === 409) {
      return 'Ya enviaste una solicitud para esta mascota. Puedes revisarla en "Mis solicitudes".';
    }
    if (estado === 400) {
      return 'Esta mascota ya no está disponible para adopción.';
    }
    return 'No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo.';
  }

  /** Muestra el aviso de adopción responsable. Al cancelar, regresa al detalle de la mascota. */
  private mostrarAdopcionResponsable(mascotaId: number): void {
    this.avisoAbierto?.dismiss();
    const ref = this.modal.open(AdopcionResponsableModal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      ariaLabelledBy: 'titulo-adopcion-responsable',
    });
    this.avisoAbierto = ref;
    ref.result.then(
      () => this.aceptoAdopcion.set(true),
      () => {
        // Si el componente ya se destruyó (el usuario navegó a otra parte), no hay que navegar.
        if (this.avisoAbierto === ref) {
          this.router.navigate(['/mascotas', mascotaId]);
        }
      },
    );
  }

  private cargarMascota(): void {
    this.aceptoAdopcion.set(false);
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotaService.obtenerPorId(this.mascotaId).subscribe({
      next: (mascota) => {
        this.mascota.set(mascota);
        this.cargando.set(false);
        this.mostrarAdopcionResponsable(mascota.id);
      },
      error: (error: unknown) => {
        this.noEncontrada.set(esNoEncontrado(error));
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }
}
