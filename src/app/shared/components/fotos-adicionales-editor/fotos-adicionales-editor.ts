import { HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';

import { estadoHttp, mensajeError } from '../../../core/http/api.util';
import { ErrorImagen, prepararImagen } from '../../../core/utils/preparar-imagen';
import { DeteccionMascotaService } from '../../../services/deteccion-mascota.service';
import { ModeracionImagenService } from '../../../services/moderacion-imagen.service';
import { UploadService } from '../../../services/upload.service';
import { FotoMascota } from '../foto-mascota/foto-mascota';

/** Avance: "Revisando foto {actual} de {total}..." o "Subiendo {actual} de {total}...". */
interface Avance {
  actual: number;
  total: number;
  etapa: 'revisando' | 'subiendo';
}

/**
 * Rejilla para agregar, quitar o promover a principal las fotos adicionales de una mascota.
 * Recibe la lista con [urls] y avisa la nueva con (urlsChange). (hacerPortada) pide usar una foto como principal.
 */
@Component({
  imports: [FotoMascota],
  selector: 'app-fotos-adicionales-editor',
  styleUrl: './fotos-adicionales-editor.scss',
  templateUrl: './fotos-adicionales-editor.html',
})
export class FotosAdicionalesEditor {
  private readonly uploadService = inject(UploadService);
  private readonly moderacion = inject(ModeracionImagenService);
  private readonly deteccion = inject(DeteccionMascotaService);

  @Input() urls: string[] = [];
  @Input() maximo = 5;
  /** URL de la foto principal; sin ella todavía no se pueden agregar fotos adicionales. */
  @Input() portada: string | null = null;
  @Output() readonly urlsChange = new EventEmitter<string[]>();
  @Output() readonly hacerPortada = new EventEmitter<string>();
  @Output() readonly procesandoChange = new EventEmitter<boolean>();

  protected readonly avance = signal<Avance | null>(null);
  /** Mensajes breves de los archivos que no se pudieron agregar. */
  protected readonly avisos = signal<string[]>([]);
  /** Nombres de los archivos rechazados por contenido inapropiado. */
  protected readonly rechazadas = signal<string[]>([]);
  /** Fotos en las que no se detectó un perro o gato; esperan a que el usuario decida. */
  protected readonly sinMascota = signal<File[]>([]);
  protected readonly subidaNoConfigurada = signal(false);

  protected quitar(url: string): void {
    this.urlsChange.emit(this.urls.filter((u) => u !== url));
  }

  protected alElegirArchivos(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    // Permite volver a elegir los mismos archivos después.
    input.value = '';
    if (archivos.length > 0) {
      this.agregar(archivos);
    }
  }

  /** Nombres de los archivos sin mascota detectada, separados por coma (para el aviso). */
  protected nombresSinMascota(): string {
    return this.sinMascota()
      .map((archivo) => archivo.name)
      .join(', ');
  }

  /** El usuario decidió subir las fotos en las que no se detectó un perro o gato. */
  protected subirSinMascota(): void {
    const archivos = this.sinMascota();
    this.sinMascota.set([]);
    this.agregar(archivos, true);
  }

  /**
   * Revisa, procesa y sube los archivos uno por uno; los que fallan o se rechazan se omiten con un aviso.
   * `confirmadas`: ya pasaron las revisiones y el usuario confirmó que quiere subirlas.
   */
  private async agregar(archivos: File[], confirmadas = false): Promise<void> {
    const lista = [...this.urls];
    const espacio = this.maximo - lista.length;
    const avisos: string[] = [];
    if (archivos.length > espacio) {
      avisos.push(`Solo puedes agregar hasta ${this.maximo} fotos adicionales.`);
    }
    const seleccion = archivos.slice(0, Math.max(espacio, 0));
    this.avisos.set(avisos);
    this.rechazadas.set([]);
    this.sinMascota.set([]);
    this.subidaNoConfigurada.set(false);
    if (seleccion.length === 0) {
      return;
    }

    this.procesandoChange.emit(true);
    for (let i = 0; i < seleccion.length; i++) {
      const archivo = seleccion[i];

      if (!confirmadas) {
        // 1) Revisar la foto ANTES de achicarla o subirla. Si se rechaza, se salta y se sigue con las demás.
        this.avance.set({ actual: i + 1, total: seleccion.length, etapa: 'revisando' });
        const revision = await this.moderacion.validar(archivo);
        if (!revision.aceptada) {
          this.rechazadas.update((nombres) => [...nombres, archivo.name]);
          continue;
        }
        // Si no parece haber un perro o gato, se aparta para preguntarle al usuario al final.
        if (!(await this.deteccion.contieneMascota(archivo))) {
          this.sinMascota.update((pendientes) => [...pendientes, archivo]);
          continue;
        }
      }

      // 2) Achicarla y subirla.
      this.avance.set({ actual: i + 1, total: seleccion.length, etapa: 'subiendo' });
      try {
        const foto = await prepararImagen(archivo);
        const url = await this.subir(foto);
        lista.push(url);
        this.urlsChange.emit([...lista]);
      } catch (error: unknown) {
        if (estadoHttp(error) === 503) {
          this.subidaNoConfigurada.set(true);
          break; // Si la subida no está configurada, fallarían todas.
        }
        const mensaje =
          error instanceof ErrorImagen ? error.message : mensajeError(error, 'No pudimos subir la foto.');
        avisos.push(`${archivo.name}: ${mensaje}`);
        this.avisos.set([...avisos]);
      }
    }
    this.avance.set(null);
    this.procesandoChange.emit(false);
  }

  /** Sube una foto y resuelve con su URL. */
  private subir(foto: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      this.uploadService.subirFotoMascota(foto, 'mascota.jpg').subscribe({
        next: (evento) => {
          if (evento.type === HttpEventType.Response) {
            const url = evento.body?.datos?.url;
            if (url) {
              resolve(url);
            } else {
              reject(new Error('No recibimos la dirección de la foto.'));
            }
          }
        },
        error: (error: unknown) => reject(error),
      });
    });
  }
}
