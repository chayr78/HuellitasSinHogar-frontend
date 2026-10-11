import { Component, Input, computed, inject, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { esNoEncontrado } from '../../../core/http/api.util';
import { ETIQUETA_ENERGIA, ETIQUETA_ESPECIE, ETIQUETA_TAMANO, ETIQUETA_TIPO_PUBLICADOR } from '../../../models/etiquetas';
import { MascotaResponse, NivelEnergia, Tamano } from '../../../models/mascota.model';
import { MascotaService } from '../../../services/mascota.service';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { CarruselFotos } from '../../../shared/components/carrusel-fotos/carrusel-fotos';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';
import { IconoHuella } from '../../../shared/components/icono-huella/icono-huella';
/** Detalle de una mascota (/mascotas/:id) con los botones para enviar solicitud o hacer la encuesta. */
@Component({
  imports: [RouterLink, CarruselFotos, Avatar, IconoHuella, BadgeEstado, FotoMascota],
  selector: 'app-mascota-detail',
  styleUrl: './mascota-detail.scss',
  templateUrl: './mascota-detail.html',
})
export class MascotaDetail {
  private readonly mascotaService = inject(MascotaService);
  protected readonly auth = inject(AuthService);

  /** Parámetro `:id` de la ruta. Cada vez que cambia se carga la mascota. */
  @Input({ required: true, transform: numberAttribute }) set id(valor: number) {
    this.cargarMascota(valor);
  }

  protected readonly mascota = signal<MascotaResponse | null>(null);
  /** Portada primero y después las fotos adicionales, sin vacíos. */
  protected readonly fotos = computed(() => {
    const m = this.mascota();
    if (!m) {
      return [];
    }
    return [m.fotoUrl, ...(m.fotosAdicionales ?? [])].filter((url): url is string => !!url?.trim());
  });
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly noEncontrada = signal(false);

  protected readonly etiquetaTamano = ETIQUETA_TAMANO;
  protected readonly etiquetaEnergia = ETIQUETA_ENERGIA;
  protected readonly etiquetaTipoPublicador = ETIQUETA_TIPO_PUBLICADOR;
  protected readonly etiquetaEspecie = ETIQUETA_ESPECIE;
  /** Posición de cada valor en los medidores visuales (1 a 3). */
  protected readonly nivelTamano: Record<Tamano, number> = { CHICO: 1, MEDIANO: 2, GRANDE: 3 };
  protected readonly nivelEnergia: Record<NivelEnergia, number> = { BAJA: 1, MEDIA: 2, ALTA: 3 };

  private cargarMascota(id: number): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotaService.obtenerPorId(id).subscribe({
      next: (mascota) => {
        this.mascota.set(mascota);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.noEncontrada.set(esNoEncontrado(error));
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }
}
