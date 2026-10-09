import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeError } from '../../../core/http/api.util';
import { MascotaResponse } from '../../../models/mascota.model';
import { SolicitudResponse } from '../../../models/solicitud.model';
import { ConfirmService } from '../../../services/confirm.service';
import { MascotaService } from '../../../services/mascota.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { ToastService } from '../../../services/toast.service';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';
import { GestionMascotaModal } from '../gestion-mascota-modal/gestion-mascota-modal';

/** Una mascota del publicador junto con las solicitudes que ha recibido. */
interface Publicacion {
  mascota: MascotaResponse;
  solicitudes: SolicitudResponse[];
  /** True si falló la petición de sus solicitudes. */
  errorSolicitudes: boolean;
}

/** Lo que pide abrir una notificación: el modal de una mascota, resaltando una de sus solicitudes. */
interface AperturaPendiente {
  mascotaId: number;
  solicitudId: number | null;
}

/** Panel del publicador (/panel): sus mascotas, cuántas solicitudes tiene cada una y acciones para gestionarlas. */
@Component({
  imports: [RouterLink, DatePipe, FotoMascota, BadgeEstado],
  selector: 'app-panel-publicador',
  styleUrl: './panel-publicador.scss',
  templateUrl: './panel-publicador.html',
})
export class PanelPublicador implements OnInit {
  private readonly mascotaService = inject(MascotaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(NgbModal);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  /** Id de la mascota que se está eliminando, para desactivar su botón. */
  protected readonly eliminando = signal<number | null>(null);

  /** Modal que hay que abrir en cuanto terminen de cargar las mascotas (viene de una notificación). */
  private aperturaPendiente: AperturaPendiente | null = null;
  private yaSeCargo = false;

  ngOnInit(): void {
    // Se escucha queryParamMap (no solo el snapshot) para que también funcione si ya estás en /panel.
    this.route.queryParamMap.subscribe((params) => this.alCambiarParametros(params));
  }

  protected nombrePublicador(): string {
    return this.auth.usuario()?.nombre ?? 'Tu panel';
  }

  /** Pide las mascotas del publicador y después las solicitudes de cada una. */
  protected cargar(): void {
    this.yaSeCargo = true;
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotaService.obtenerMias().subscribe({
      next: (mascotas) => this.cargarSolicitudes(mascotas),
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  /** Abre el modal de una mascota. `solicitudDestacada` se resalta dentro del modal (opcional). */
  protected abrirGestion(publicacion: Publicacion, solicitudDestacada: number | null = null): void {
    const ref = this.modal.open(GestionMascotaModal, {
      size: 'lg',
      centered: true,
      scrollable: true,
      ariaLabelledBy: 'titulo-gestion',
    });
    const gestion: GestionMascotaModal = ref.componentInstance;
    gestion.inicializar(publicacion.mascota, publicacion.solicitudes, {
      solicitudDestacada,
      errorSolicitudes: publicacion.errorSolicitudes,
    });

    // Lo que cambie dentro del modal se refleja en la tarjeta del panel.
    const id = publicacion.mascota.id;
    gestion.mascotaActualizada.subscribe((mascota) => this.actualizarPublicacion(id, { mascota }));
    gestion.solicitudesActualizadas.subscribe((solicitudes) => this.actualizarPublicacion(id, { solicitudes }));
  }

  protected async eliminar(mascota: MascotaResponse): Promise<void> {
    const confirmado = await this.confirm.confirmar({
      titulo: `¿Eliminar a ${mascota.nombre}?`,
      mensaje: 'La publicación y sus solicitudes dejarán de estar disponibles. Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!confirmado) {
      return;
    }
    this.eliminando.set(mascota.id);
    this.mascotaService.eliminar(mascota.id).subscribe({
      next: () => {
        this.publicaciones.update((lista) => lista.filter((p) => p.mascota.id !== mascota.id));
        this.toast.success(`Eliminaste la publicación de ${mascota.nombre}.`);
        this.notificaciones.refrescar();
        this.eliminando.set(null);
      },
      error: (error: unknown) => {
        this.toast.error(mensajeError(error, 'No pudimos eliminar la publicación. Inténtalo de nuevo.'));
        this.eliminando.set(null);
      },
    });
  }

  /** Pide las solicitudes de cada mascota y muestra el panel cuando han respondido todas. */
  private cargarSolicitudes(mascotas: MascotaResponse[]): void {
    const publicaciones: Publicacion[] = mascotas.map((mascota) => ({
      mascota,
      solicitudes: [],
      errorSolicitudes: false,
    }));
    let pendientes = publicaciones.length;
    const alTerminarUna = () => {
      pendientes--;
      if (pendientes <= 0) {
        this.publicaciones.set(publicaciones);
        this.cargando.set(false);
        this.abrirAperturaPendiente();
      }
    };

    if (publicaciones.length === 0) {
      alTerminarUna();
      return;
    }
    for (const publicacion of publicaciones) {
      this.solicitudService.obtenerPorMascota(publicacion.mascota.id).subscribe({
        next: (solicitudes) => {
          publicacion.solicitudes = solicitudes;
          alTerminarUna();
        },
        // Si falla, esa mascota se muestra sin solicitudes (y el modal lo avisa) en lugar de romper todo el panel.
        error: () => {
          publicacion.errorSolicitudes = true;
          alTerminarUna();
        },
      });
    }
  }

  /**
   * Si la URL trae ?mascota=ID (clic en una notificación), recarga el panel para tener las solicitudes al día
   * y deja anotado qué modal abrir. Sin parámetros, solo carga la primera vez.
   */
  private alCambiarParametros(params: ParamMap): void {
    const mascotaId = Number(params.get('mascota'));
    if (mascotaId) {
      this.aperturaPendiente = { mascotaId, solicitudId: Number(params.get('solicitud')) || null };
      this.cargar();
    } else if (!this.yaSeCargo) {
      this.cargar();
    }
  }

  /** Abre el modal pedido por la notificación y quita los parámetros de la URL para que no se reabra al recargar. */
  private abrirAperturaPendiente(): void {
    const pendiente = this.aperturaPendiente;
    if (!pendiente) {
      return;
    }
    this.aperturaPendiente = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });

    const publicacion = this.publicaciones().find((p) => p.mascota.id === pendiente.mascotaId);
    if (!publicacion) {
      this.toast.error('No encontramos esa mascota');
      return;
    }
    this.abrirGestion(publicacion, pendiente.solicitudId);
  }

  private actualizarPublicacion(mascotaId: number, cambios: Partial<Publicacion>): void {
    this.publicaciones.update((lista) => lista.map((p) => (p.mascota.id === mascotaId ? { ...p, ...cambios } : p)));
  }
}
