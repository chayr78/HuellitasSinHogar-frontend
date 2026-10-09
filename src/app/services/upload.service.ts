import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../core/config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { UploadResponse } from '../models/upload.model';

/** Subida de archivos al backend (/uploads/...). */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);

  /** Sube la foto de una mascota. Emite eventos HTTP para poder mostrar el progreso. */
  subirFotoMascota(archivo: Blob, nombreArchivo: string): Observable<HttpEvent<ApiResponse<UploadResponse>>> {
    return this.subir('mascota', archivo, nombreArchivo);
  }

  /** Sube la foto de perfil del usuario con sesión iniciada. También emite eventos de progreso. */
  subirFotoPerfil(archivo: Blob, nombreArchivo: string): Observable<HttpEvent<ApiResponse<UploadResponse>>> {
    return this.subir('perfil', archivo, nombreArchivo);
  }

  private subir(
    destino: 'mascota' | 'perfil',
    archivo: Blob,
    nombreArchivo: string,
  ): Observable<HttpEvent<ApiResponse<UploadResponse>>> {
    const formulario = new FormData();
    formulario.append('archivo', archivo, nombreArchivo);
    return this.http.post<ApiResponse<UploadResponse>>(`${API_URL}/uploads/${destino}`, formulario, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
