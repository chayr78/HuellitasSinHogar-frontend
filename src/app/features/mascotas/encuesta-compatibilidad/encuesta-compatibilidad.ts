import { Component, Input, inject, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { esNoEncontrado, mensajeError } from '../../../core/http/api.util';
import { MascotaResponse } from '../../../models/mascota.model';
import { RespuestasEncuesta, ResultadoCompatibilidad } from '../../../models/solicitud.model';
import { EncuestaStateService } from '../../../services/encuesta-state.service';
import { MascotaService } from '../../../services/mascota.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';
import { ClavePregunta, PREGUNTAS_ENCUESTA, ValorRespuesta } from './preguntas-encuesta';

/** Radio del anillo SVG del resultado. */
const RADIO_ANILLO = 70;

/**
 * Encuesta de compatibilidad (/mascotas/:id/encuesta): 5 preguntas y el porcentaje que calcula el backend.
 * El resultado se guarda en EncuestaStateService para enviarlo después con la solicitud.
 */
@Component({
  imports: [RouterLink, FotoMascota],
  selector: 'app-encuesta-compatibilidad',
  styleUrl: './encuesta-compatibilidad.scss',
  templateUrl: './encuesta-compatibilidad.html',
})
export class EncuestaCompatibilidad {
  private readonly mascotaService = inject(MascotaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly encuestaState = inject(EncuestaStateService);

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

  protected readonly preguntas = PREGUNTAS_ENCUESTA;
  /** Respuesta elegida en cada pregunta (las que faltan no aparecen). */
  protected readonly respuestas = signal<Partial<Record<ClavePregunta, ValorRespuesta>>>({});

  protected readonly resultado = signal<ResultadoCompatibilidad | null>(null);
  protected readonly calculando = signal(false);
  protected readonly errorCalculo = signal<string | null>(null);

  protected readonly radio = RADIO_ANILLO;
  protected readonly circunferencia = 2 * Math.PI * RADIO_ANILLO;

  protected estaSeleccionada(clave: ClavePregunta, valor: ValorRespuesta): boolean {
    return this.respuestas()[clave] === valor;
  }

  protected seleccionar(clave: ClavePregunta, valor: ValorRespuesta): void {
    this.respuestas.update((actuales) => ({ ...actuales, [clave]: valor }));
    // Si cambian las respuestas, el resultado anterior ya no vale.
    if (this.resultado()) {
      this.resultado.set(null);
      this.encuestaState.limpiar();
    }
  }

  protected puedeCalcular(): boolean {
    return this.respuestasCompletas() !== null && !this.calculando();
  }

  /** Parte del anillo que queda sin pintar según el porcentaje. */
  protected offsetAnillo(): number {
    const porcentaje = Math.min(100, Math.max(0, this.resultado()?.porcentaje ?? 0));
    return this.circunferencia * (1 - porcentaje / 100);
  }

  protected calcular(): void {
    const respuestas = this.respuestasCompletas();
    if (!respuestas || this.calculando()) {
      return;
    }
    const mascotaId = this.mascotaId;
    this.calculando.set(true);
    this.errorCalculo.set(null);

    const datos = { mascotaId, tipoVivienda: respuestas.tipoVivienda, horasDisponibles: respuestas.horasDisponibles };
    this.solicitudService.calcularCompatibilidad(datos).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.encuestaState.guardar(mascotaId, respuestas, resultado.porcentaje);
        this.calculando.set(false);
      },
      error: (error: unknown) => {
        this.errorCalculo.set(
          mensajeError(error, 'No pudimos calcular tu compatibilidad en este momento. Inténtalo de nuevo en unos minutos.'),
        );
        this.calculando.set(false);
      },
    });
  }

  /** Las respuestas, solo si se contestaron las 5 preguntas. */
  private respuestasCompletas(): RespuestasEncuesta | null {
    const respuestas = this.respuestas();
    const completas = this.preguntas.every((pregunta) => respuestas[pregunta.clave] !== undefined);
    // Cada valor sale de las opciones de su propia pregunta, así que el tipo es correcto.
    return completas ? (respuestas as RespuestasEncuesta) : null;
  }

  private cargarMascota(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotaService.obtenerPorId(this.mascotaId).subscribe({
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
