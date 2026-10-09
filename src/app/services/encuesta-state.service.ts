import { Injectable, signal } from '@angular/core';

import { RespuestasEncuesta } from '../models/solicitud.model';

/** Guarda el resultado de la encuesta para que la pantalla de solicitud lo envíe junto con los datos de contacto. */
@Injectable({ providedIn: 'root' })
export class EncuestaStateService {
  private readonly mascotaId = signal<number | null>(null);
  private readonly respuestas = signal<RespuestasEncuesta | null>(null);
  private readonly porcentaje = signal<number | null>(null);

  guardar(mascotaId: number, respuestas: RespuestasEncuesta, porcentaje: number): void {
    this.mascotaId.set(mascotaId);
    this.respuestas.set(respuestas);
    this.porcentaje.set(porcentaje);
  }

  /** Respuestas guardadas, solo si son de la mascota indicada. */
  respuestasPara(mascotaId: number): RespuestasEncuesta | null {
    return this.mascotaId() === mascotaId ? this.respuestas() : null;
  }

  porcentajePara(mascotaId: number): number | null {
    return this.mascotaId() === mascotaId ? this.porcentaje() : null;
  }

  limpiar(): void {
    this.mascotaId.set(null);
    this.respuestas.set(null);
    this.porcentaje.set(null);
  }
}
