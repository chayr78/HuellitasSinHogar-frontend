import { Component, Input, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { esNoEncontrado, estadoHttp, mensajeError } from '../../../core/http/api.util';
import {
  ESPECIES,
  ETIQUETA_ENERGIA,
  ETIQUETA_ESPECIE,
  ETIQUETA_SEXO,
  ETIQUETA_TAMANO,
  ICONO_SEXO,
  NIVELES_ENERGIA,
  SEXOS,
  TAMANOS,
} from '../../../models/etiquetas';
import { Especie, MascotaResponse, NivelEnergia, Sexo, Tamano } from '../../../models/mascota.model';
import { MascotaService } from '../../../services/mascota.service';
import { ToastService } from '../../../services/toast.service';
import { FotoUploader } from '../../../shared/components/foto-uploader/foto-uploader';
import { FotosAdicionalesEditor } from '../../../shared/components/fotos-adicionales-editor/fotos-adicionales-editor';

/**
 * Formulario para publicar una mascota (/panel/nueva) o editarla (/panel/editar/:id).
 * En modo edición primero carga la mascota y rellena el formulario.
 */
@Component({
  imports: [RouterLink, ReactiveFormsModule, FotoUploader, FotosAdicionalesEditor],
  selector: 'app-publicar-mascota',
  templateUrl: './publicar-mascota.html',
})
export class PublicarMascota {
  private readonly mascotaService = inject(MascotaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Parámetro `:id` de la ruta; solo llega en modo edición. */
  @Input() set id(valor: string | undefined) {
    const id = Number(valor);
    if (valor && Number.isInteger(id) && id > 0) {
      this.mascotaId.set(id);
      this.cargarMascota(id);
    }
  }

  /** Id de la mascota que se edita, o null si es una publicación nueva. */
  protected readonly mascotaId = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal(false);
  protected readonly noEncontrada = signal(false);

  protected readonly formulario = this.fb.group({
    fotoUrl: this.fb.control<string | null>(null),
    fotosAdicionales: this.fb.control<string[]>([]),
    nombre: ['', [Validators.required]],
    especie: this.fb.control<Especie | null>(null, Validators.required),
    sexo: this.fb.control<Sexo | null>(null, Validators.required),
    edadAproximada: [''],
    tamano: this.fb.control<Tamano | null>(null, Validators.required),
    nivelEnergia: this.fb.control<NivelEnergia | null>(null, Validators.required),
    descripcion: [''],
  });

  protected readonly especies = ESPECIES;
  protected readonly sexos = SEXOS;
  protected readonly etiquetaSexo = ETIQUETA_SEXO;
  protected readonly iconoSexo = ICONO_SEXO;
  protected readonly tamanos = TAMANOS;
  protected readonly energias = NIVELES_ENERGIA;
  protected readonly etiquetaEspecie = ETIQUETA_ESPECIE;
  protected readonly etiquetaTamano = ETIQUETA_TAMANO;
  protected readonly etiquetaEnergia = ETIQUETA_ENERGIA;

  protected readonly guardando = signal(false);
  /** Mientras la foto se sube aún no tenemos su URL: guardar en ese momento la perdería. */
  protected readonly subiendoFoto = signal(false);
  /** Lo mismo para las fotos adicionales. */
  protected readonly subiendoFotosAdicionales = signal(false);
  protected readonly error = signal<string | null>(null);

  /** La foto elegida pasa a ser la principal y la principal anterior ocupa su lugar en la lista. */
  protected hacerPrincipal(url: string): void {
    const portadaAnterior = this.formulario.controls.fotoUrl.value;
    const lista = this.formulario.controls.fotosAdicionales.value
      .map((u) => (u === url ? portadaAnterior : u))
      .filter((u): u is string => !!u?.trim());
    this.formulario.patchValue({ fotoUrl: url, fotosAdicionales: lista });
  }

  protected esEdicion(): boolean {
    return this.mascotaId() !== null;
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected elegir<T>(control: AbstractControl<T | null>, valor: T): void {
    control.setValue(valor);
    control.markAsTouched();
  }

  protected guardar(): void {
    const { fotoUrl, fotosAdicionales, nombre, especie, sexo, edadAproximada, tamano, nivelEnergia, descripcion } =
      this.formulario.getRawValue();
    if (this.formulario.invalid || !especie || !sexo || !tamano || !nivelEnergia) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.guardando() || this.subiendoFoto() || this.subiendoFotosAdicionales()) {
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    // Si se quitó la principal pero hay fotos adicionales, la primera pasa a ser la principal.
    const adicionales = fotosAdicionales.filter((u) => u.trim());
    const portada = fotoUrl?.trim() || adicionales.shift() || null;

    const datos = {
      nombre: nombre.trim(),
      especie,
      sexo,
      edadAproximada: edadAproximada.trim(),
      fotoUrl: portada,
      tamano,
      nivelEnergia,
      descripcion: descripcion.trim(),
      // Se envía siempre (también vacía) para que en edición se guarden las fotos quitadas.
      fotosAdicionales: adicionales,
    };
    const id = this.mascotaId();
    const peticion: Observable<MascotaResponse> =
      id === null ? this.mascotaService.crear(datos) : this.mascotaService.actualizar(id, datos);

    peticion.subscribe({
      next: (mascota) => {
        this.toast.success(id === null ? `¡${mascota.nombre} ya está publicado!` : 'Cambios guardados.');
        this.router.navigateByUrl('/panel');
      },
      error: (error: unknown) => {
        // 409: la mascota ya fue adoptada; mensajeError muestra el texto que manda el backend.
        const porDefecto =
          estadoHttp(error) === 409
            ? 'Esta mascota ya fue adoptada; sus datos no se pueden editar.'
            : 'No pudimos guardar la mascota. Inténtalo de nuevo.';
        this.error.set(mensajeError(error, porDefecto));
        this.guardando.set(false);
      },
    });
  }

  private cargarMascota(id: number): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotaService.obtenerPorId(id).subscribe({
      next: (mascota) => {
        // Una mascota adoptada ya no se puede editar.
        if (mascota.estado === 'ADOPTADO') {
          this.toast.error('Esta mascota ya fue adoptada; sus datos no se pueden editar.');
          this.router.navigateByUrl('/panel');
          return;
        }
        this.rellenarFormulario(mascota);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.noEncontrada.set(esNoEncontrado(error));
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  private rellenarFormulario(mascota: MascotaResponse): void {
    this.formulario.reset({
      fotoUrl: mascota.fotoUrl,
      fotosAdicionales: mascota.fotosAdicionales ?? [],
      nombre: mascota.nombre,
      especie: mascota.especie,
      // Las mascotas publicadas antes de este campo no lo tienen: el publicador lo elige al editar.
      sexo: mascota.sexo ?? null,
      edadAproximada: mascota.edadAproximada ?? '',
      tamano: mascota.tamano,
      nivelEnergia: mascota.nivelEnergia,
      descripcion: mascota.descripcion ?? '',
    });
  }
}
