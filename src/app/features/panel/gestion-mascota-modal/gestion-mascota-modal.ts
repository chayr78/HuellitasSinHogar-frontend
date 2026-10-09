import { DatePipe } from '@angular/common';
import { Component, Injector, afterNextRender, inject, output, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ESTADOS_MASCOTA, ESTADOS_SOLICITUD, ETIQUETA_ESTADO, ETIQUETA_ESTADO_SOLICITUD } from '../../../models/etiquetas';
import { EstadoMascota, MascotaResponse } from '../../../models/mascota.model';
import { EstadoSolicitud, SolicitudResponse } from '../../../models/solicitud.model';
import { mensajeError } from '../../../core/http/api.util';
import { ConfirmService } from '../../../services/confirm.service';
import { MascotaService } from '../../../services/mascota.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { Avatar } from '../../../shared/components/avatar/avatar';

/**
 * Modal del panel para cambiar el estado de una mascota y de sus solicitudes. Lo abre PanelPublicador con NgbModal;
 * avisa los cambios con los outputs mascotaActualizada y solicitudesActualizadas.
 */
@Component({
  imports: [DatePipe, Avatar],
  selector: 'app-gestion-mascota-modal',
  styleUrl: './gestion-mascota-modal.scss',
  templateUrl: './gestion-mascota-modal.html',
})
export class GestionMascotaModal {
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly mascotaService = inject(MascotaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly injector = inject(Injector);
  private readonly confirm = inject(ConfirmService);

  readonly mascotaActualizada = output<MascotaResponse>();
  readonly solicitudesActualizadas = output<SolicitudResponse[]>();

  protected readonly mascota = signal<MascotaResponse | null>(null);
  protected readonly solicitudes = signal<SolicitudResponse[]>([]);
  /** Solicitudes que no estaban leídas al abrir el modal (se resaltan como nuevas). */
  protected readonly nuevas = signal<ReadonlySet<number>>(new Set());
  /** Solicitud que se resalta y a la que se hace scroll (cuando se llega desde una notificación). */
  protected readonly destacada = signal<number | null>(null);
  /** True si no se pudieron cargar las solicitudes de esta mascota. */
  protected readonly errorSolicitudes = signal(false);

  protected readonly guardandoEstado = signal(false);
  protected readonly guardandoSolicitud = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly estadosMascota = ESTADOS_MASCOTA;
  protected readonly estadosSolicitud = ESTADOS_SOLICITUD;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly etiquetaEstadoSolicitud = ETIQUETA_ESTADO_SOLICITUD;

  /**
   * Carga los datos iniciales y marca como leídas las solicitudes pendientes de leer.
   * `opciones.solicitudDestacada`: id de la solicitud a resaltar (viene de una notificación).
   * `opciones.errorSolicitudes`: true si el panel no pudo cargar las solicitudes.
   */
  inicializar(
    mascota: MascotaResponse,
    solicitudes: SolicitudResponse[],
    opciones: { solicitudDestacada: number | null; errorSolicitudes: boolean },
  ): void {
    this.mascota.set(mascota);
    this.solicitudes.set(solicitudes);
    this.errorSolicitudes.set(opciones.errorSolicitudes);
    this.destacada.set(opciones.solicitudDestacada);
    if (opciones.solicitudDestacada !== null) {
      this.irASolicitud(opciones.solicitudDestacada);
    }

    const noLeidas = solicitudes.filter((s) => !s.leidaPublicador);
    this.nuevas.set(new Set(noLeidas.map((s) => s.id)));
    if (noLeidas.length === 0) {
      return;
    }

    // Cuando responden todas, se actualiza la campana. Si una falla, seguirá como no leída.
    let pendientes = noLeidas.length;
    const alTerminarUna = () => {
      pendientes--;
      if (pendientes === 0) {
        this.notificaciones.refrescar();
      }
    };
    for (const solicitud of noLeidas) {
      this.solicitudService.marcarLeidaPublicador(solicitud.id).subscribe({
        next: () => {
          this.actualizarSolicitudes((s) => (s.id === solicitud.id ? { ...s, leidaPublicador: true } : s));
          alTerminarUna();
        },
        error: alTerminarUna,
      });
    }
  }

  protected async cambiarEstadoMascota(estado: EstadoMascota): Promise<void> {
    const mascota = this.mascota();
    if (!mascota || mascota.estado === estado || this.guardandoEstado()) {
      return;
    }
    // Entrar o salir de ADOPTADO tiene consecuencias: se pide confirmación.
    const mensaje = this.mensajeConfirmacion(mascota.estado, estado);
    if (mensaje) {
      const confirmado = await this.confirm.confirmar({
        titulo: `¿Cambiar el estado de ${mascota.nombre}?`,
        mensaje,
        textoConfirmar: 'Continuar',
      });
      if (!confirmado) {
        return;
      }
    }
    this.guardandoEstado.set(true);
    this.error.set(null);

    this.mascotaService.cambiarEstado(mascota.id, estado).subscribe({
      next: () => {
        const actualizada = { ...mascota, estado };
        this.mascota.set(actualizada);
        this.mascotaActualizada.emit(actualizada);
        this.notificaciones.refrescar();
        this.guardandoEstado.set(false);
        // Al adoptarse, el backend cierra las solicitudes abiertas: se recargan para verlas al día.
        if (estado === 'ADOPTADO') {
          this.recargarSolicitudes(mascota.id);
        }
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No pudimos cambiar el estado de la mascota. Inténtalo de nuevo.'));
        this.guardandoEstado.set(false);
      },
    });
  }

  protected cambiarEstadoSolicitud(solicitud: SolicitudResponse, estado: EstadoSolicitud): void {
    if (solicitud.estado === estado || this.guardandoSolicitud() !== null) {
      return;
    }
    this.guardandoSolicitud.set(solicitud.id);
    this.error.set(null);

    this.solicitudService.cambiarEstado(solicitud.id, estado).subscribe({
      next: () => {
        this.actualizarSolicitudes((s) => (s.id === solicitud.id ? { ...s, estado } : s));
        this.notificaciones.refrescar();
        this.guardandoSolicitud.set(null);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No pudimos actualizar la solicitud. Inténtalo de nuevo.'));
        this.guardandoSolicitud.set(null);
      },
    });
  }

  /** Texto de confirmación al entrar o salir de ADOPTADO; null si no hace falta confirmar. */
  private mensajeConfirmacion(actual: EstadoMascota, nuevo: EstadoMascota): string | null {
    if (nuevo === 'ADOPTADO') {
      return 'Se cerrarán las solicitudes abiertas y ya no podrás editar sus datos. ¿Continuar?';
    }
    if (actual === 'ADOPTADO') {
      return 'Volverá a mostrarse en el catálogo. ¿Continuar?';
    }
    return null;
  }

  private recargarSolicitudes(mascotaId: number): void {
    this.solicitudService.obtenerPorMascota(mascotaId).subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
        this.solicitudesActualizadas.emit(solicitudes);
      },
      // Si falla, se queda la lista anterior; el panel la recarga la próxima vez.
      error: () => undefined,
    });
  }

  /** Hace scroll hasta la tarjeta de la solicitud cuando el modal ya se dibujó en pantalla. */
  private irASolicitud(id: number): void {
    afterNextRender(
      () => document.getElementById(`solicitud-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      { injector: this.injector },
    );
  }

  private actualizarSolicitudes(cambio: (s: SolicitudResponse) => SolicitudResponse): void {
    this.solicitudes.update((lista) => lista.map(cambio));
    this.solicitudesActualizadas.emit(this.solicitudes());
  }
}
