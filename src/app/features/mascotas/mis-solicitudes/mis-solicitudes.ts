import { DatePipe } from '@angular/common';
import { Component, DestroyRef, Injector, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ESTADO_SOLICITUD_ADOPTANTE } from '../../../models/etiquetas';
import { SolicitudResponse } from '../../../models/solicitud.model';
import { NotificacionService } from '../../../services/notificacion.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';

/** Solicitudes enviadas por el adoptante y su estado. Al abrirla, marca como leídas las que tenían novedades. */
@Component({
  imports: [RouterLink, DatePipe, FotoMascota],
  selector: 'app-mis-solicitudes',
  styleUrl: './mis-solicitudes.scss',
  templateUrl: './mis-solicitudes.html',
})
export class MisSolicitudes implements OnInit {
  private readonly solicitudService = inject(SolicitudService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly solicitudes = signal<SolicitudResponse[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);

  /** Ids que no estaban leídas al cargar: conservan el punto "Nuevo" aunque ya se marcaron como leídas. */
  protected readonly nuevas = signal<ReadonlySet<number>>(new Set());
  /** Solicitud que se resalta (cuando se llega desde una notificación con ?solicitud=ID). */
  protected readonly destacada = signal<number | null>(null);
  protected readonly estados = ESTADO_SOLICITUD_ADOPTANTE;
  private yaSeCargo = false;

  ngOnInit(): void {
    // Se escucha queryParamMap (no solo el snapshot) para que también funcione si ya estás en esta página.
    // Con ?solicitud=ID se recarga la lista (puede haber cambiado) y se resalta esa solicitud.
    this.route.queryParamMap.subscribe((params) => {
      const solicitudId = Number(params.get('solicitud'));
      if (solicitudId) {
        this.destacada.set(solicitudId);
        this.cargar();
      } else if (!this.yaSeCargo) {
        this.cargar();
      }
    });
  }

  protected cargar(): void {
    this.yaSeCargo = true;
    this.cargando.set(true);
    this.errorCarga.set(false);
    // Si el usuario sale de la página antes de la respuesta, se cancela (evita tocar una vista destruida).
    this.solicitudService.obtenerMias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
        this.cargando.set(false);
        this.marcarComoLeidas(solicitudes);
        this.irASolicitudDestacada();
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  /** Hace scroll hasta la solicitud resaltada y quita el parámetro de la URL para que no se repita al recargar. */
  private irASolicitudDestacada(): void {
    const id = this.destacada();
    if (id === null) {
      return;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    afterNextRender(
      () => document.getElementById(`solicitud-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      { injector: this.injector },
    );
  }

  /** Marca como leídas las no leídas y, cuando terminan todas, actualiza la campana. */
  private marcarComoLeidas(solicitudes: SolicitudResponse[]): void {
    const noLeidas = solicitudes.filter((s) => !s.leidaAdoptante);
    if (noLeidas.length === 0) {
      return;
    }
    this.nuevas.set(new Set(noLeidas.map((s) => s.id)));

    let pendientes = noLeidas.length;
    const alTerminarUna = () => {
      pendientes--;
      if (pendientes === 0) {
        this.notificaciones.refrescar();
      }
    };
    for (const solicitud of noLeidas) {
      // Si una falla no pasa nada: se volverá a intentar la próxima vez.
      this.solicitudService.marcarLeidaAdoptante(solicitud.id).subscribe({ next: alTerminarUna, error: alTerminarUna });
    }
  }
}
