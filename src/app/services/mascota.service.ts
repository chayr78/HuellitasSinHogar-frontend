import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../core/config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { EstadoMascota, MascotaRequest, MascotaResponse } from '../models/mascota.model';
import { extraerDatos } from '../core/http/api.util';

/** Llamadas HTTP de mascotas (/mascotas/...). Un método por endpoint. */
@Injectable({ providedIn: 'root' })
export class MascotaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/mascotas`;

  obtenerDisponibles(): Observable<MascotaResponse[]> {
    return extraerDatos(this.http.get<ApiResponse<MascotaResponse[]>>(`${this.url}/disponibles`));
  }

  obtenerAdoptados(): Observable<MascotaResponse[]> {
    return extraerDatos(this.http.get<ApiResponse<MascotaResponse[]>>(`${this.url}/adoptados`));
  }

  obtenerPorId(id: number): Observable<MascotaResponse> {
    return extraerDatos(this.http.get<ApiResponse<MascotaResponse>>(`${this.url}/${id}`));
  }

  /** Mascotas del publicador con sesión iniciada. */
  obtenerMias(): Observable<MascotaResponse[]> {
    return extraerDatos(this.http.get<ApiResponse<MascotaResponse[]>>(`${this.url}/mias`));
  }

  crear(mascota: MascotaRequest): Observable<MascotaResponse> {
    return extraerDatos(this.http.post<ApiResponse<MascotaResponse>>(this.url, mascota));
  }

  actualizar(id: number, mascota: MascotaRequest): Observable<MascotaResponse> {
    return extraerDatos(this.http.put<ApiResponse<MascotaResponse>>(`${this.url}/${id}`, mascota));
  }

  cambiarEstado(id: number, estado: EstadoMascota): Observable<MascotaResponse> {
    return extraerDatos(this.http.patch<ApiResponse<MascotaResponse>>(`${this.url}/${id}/estado`, { estado }));
  }

  eliminar(id: number): Observable<void> {
    return extraerDatos(this.http.delete<ApiResponse<void>>(`${this.url}/${id}`));
  }
}
