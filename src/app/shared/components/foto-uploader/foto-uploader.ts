import { HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { estadoHttp, mensajeError } from '../../../core/http/api.util';
import { UploadService } from '../../../services/upload.service';
import { ErrorImagen, esFormatoPermitido, prepararImagen } from '../../../core/utils/preparar-imagen';
import { FotoMascota } from '../foto-mascota/foto-mascota';

/**
 * Elegir, achicar y subir una foto de mascota o de perfil (según `tipo`), mostrando el progreso.
 * Recibe la URL actual con [url] y avisa la nueva con (urlChange). (procesandoChange) indica si hay una subida en curso.
 */
@Component({
  imports: [FotoMascota],
  selector: 'app-foto-uploader',
  styleUrl: './foto-uploader.scss',
  templateUrl: './foto-uploader.html',
})
export class FotoUploader implements OnDestroy {
  private readonly uploadService = inject(UploadService);

  @Input() set url(valor: string | null) {
    this.urlActual.set(valor?.trim() ? valor : null);
  }
  /** A qué endpoint se sube la foto: /uploads/mascota o /uploads/perfil. */
  @Input() tipo: 'mascota' | 'perfil' = 'mascota';
  /** Forma de la vista previa. */
  @Input() forma: 'cuadrada' | 'circular' = 'cuadrada';
  /** Lado mayor (px) al que se achica la foto antes de subirla. */
  @Input() ladoMaximo = 1600;
  @Output() readonly urlChange = new EventEmitter<string | null>();
  @Output() readonly procesandoChange = new EventEmitter<boolean>();

  protected readonly urlActual = signal<string | null>(null);
  /** Vista previa local de la foto mientras se procesa o sube. */
  protected readonly previewLocal = signal<string | null>(null);
  protected readonly procesando = signal(false);
  protected readonly progreso = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  /** El backend respondió 503 (subida no configurada): se ofrece escribir la URL a mano. */
  protected readonly subidaNoConfigurada = signal(false);
  protected readonly arrastrando = signal(false);

  private subida: Subscription | null = null;
  /** Sube en cada selección o al quitar la foto; sirve para ignorar un procesamiento que ya no vale. */
  private intento = 0;

  ngOnDestroy(): void {
    this.intento++;
    this.subida?.unsubscribe();
    this.liberarPreview();
  }

  protected alElegirArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    // Permite volver a elegir el mismo archivo después de un error.
    input.value = '';
    if (archivo) {
      this.procesar(archivo);
    }
  }

  protected alArrastrar(evento: DragEvent): void {
    evento.preventDefault();
    if (!this.procesando()) {
      this.arrastrando.set(true);
    }
  }

  protected alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files[0];
    if (archivo && !this.procesando()) {
      this.procesar(archivo);
    }
  }

  protected escribirUrlManual(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value.trim() || null;
    this.cambiarUrl(valor);
  }

  protected quitarFoto(): void {
    this.intento++;
    this.subida?.unsubscribe();
    this.terminar(null);
    this.cambiarUrl(null);
  }

  private async procesar(archivo: File): Promise<void> {
    this.error.set(null);
    // El formato se revisa antes de mostrar el spinner, como siempre.
    if (!esFormatoPermitido(archivo)) {
      this.error.set('Formato no permitido. Usa una foto JPEG, PNG o WebP.');
      return;
    }

    const intento = ++this.intento;
    this.cambiarProcesando(true);
    let reducida: Blob;
    try {
      reducida = await prepararImagen(archivo, this.ladoMaximo);
    } catch (error: unknown) {
      if (intento === this.intento) {
        this.terminar(error instanceof ErrorImagen ? error.message : 'No pudimos procesar esta imagen, prueba con otra.');
      }
      return;
    }
    if (intento !== this.intento) {
      return; // El usuario quitó la foto mientras se procesaba.
    }

    this.liberarPreview();
    this.previewLocal.set(URL.createObjectURL(reducida));
    this.subir(reducida);
  }

  private subir(foto: Blob): void {
    this.progreso.set(0);
    const peticion =
      this.tipo === 'perfil'
        ? this.uploadService.subirFotoPerfil(foto, 'perfil.jpg')
        : this.uploadService.subirFotoMascota(foto, 'mascota.jpg');
    this.subida = peticion.subscribe({
      next: (evento) => {
        if (evento.type === HttpEventType.UploadProgress && evento.total) {
          this.progreso.set(Math.round((100 * evento.loaded) / evento.total));
        }
        if (evento.type === HttpEventType.Response) {
          const url = evento.body?.datos?.url ?? null;
          if (url) {
            this.cambiarUrl(url);
            this.terminar(null);
          } else {
            this.terminar('No recibimos la dirección de la foto. Inténtalo de nuevo.');
          }
        }
      },
      error: (error: unknown) => {
        if (estadoHttp(error) === 503) {
          this.subidaNoConfigurada.set(true);
          this.terminar('La subida de fotos aún no está configurada. Puedes escribir la URL de la foto.');
        } else {
          this.terminar(mensajeError(error, 'No pudimos subir la foto. Inténtalo de nuevo.'));
        }
      },
    });
  }

  /** Deja el componente en reposo, mostrando `error` si se indica. */
  private terminar(error: string | null): void {
    this.error.set(error);
    this.liberarPreview();
    this.cambiarProcesando(false);
    this.progreso.set(null);
  }

  private cambiarUrl(url: string | null): void {
    this.urlActual.set(url);
    this.urlChange.emit(url);
  }

  private cambiarProcesando(valor: boolean): void {
    this.procesando.set(valor);
    this.procesandoChange.emit(valor);
  }

  private liberarPreview(): void {
    const actual = this.previewLocal();
    if (actual) {
      URL.revokeObjectURL(actual);
      this.previewLocal.set(null);
    }
  }
}
