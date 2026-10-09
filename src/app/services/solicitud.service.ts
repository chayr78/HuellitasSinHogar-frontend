import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../core/config/api.config';
import { ApiResponse } from '../models/api-response.model';
import {
  CompatibilidadRequest,
  EstadoSolicitud,
  ResultadoCompatibilidad,
  SolicitudRequest,
  SolicitudResponse,
} from '../models/solicitud.model';
import { extraerDatos } from '../core/http/api.util';

/** Llamadas HTTP de solicitudes de adopción (/solicitudes/...). Un método por endpoint. */
@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/solicitudes`;

  calcularCompatibilidad(datos: CompatibilidadRequest): Observable<ResultadoCompatibilidad> {
    return extraerDatos(this.http.post<ApiResponse<ResultadoCompatibilidad>>(`${this.url}/compatibilidad`, datos));
  }

  crear(solicitud: SolicitudRequest): Observable<SolicitudResponse> {
    return extraerDatos(this.http.post<ApiResponse<SolicitudResponse>>(this.url, solicitud));
  }

  /** Solicitudes del adoptante con sesión iniciada. */
  obtenerMias(): Observable<SolicitudResponse[]> {
    return extraerDatos(this.http.get<ApiResponse<SolicitudResponse[]>>(`${this.url}/mias`));
  }

  /** True si el adoptante ya tiene una solicitud PENDIENTE o CONTACTADA. */
  tieneSolicitudActiva(): Observable<boolean> {
    return extraerDatos(this.http.get<ApiResponse<boolean>>(`${this.url}/activa`));
  }

  obtenerPorMascota(mascotaId: number): Observable<SolicitudResponse[]> {
    return extraerDatos(this.http.get<ApiResponse<SolicitudResponse[]>>(`${this.url}/mascota/${mascotaId}`));
  }

  cambiarEstado(id: number, estado: EstadoSolicitud): Observable<SolicitudResponse> {
    return extraerDatos(this.http.patch<ApiResponse<SolicitudResponse>>(`${this.url}/${id}/estado`, { estado }));
  }

  marcarLeidaPublicador(id: number): Observable<SolicitudResponse> {
    return extraerDatos(this.http.patch<ApiResponse<SolicitudResponse>>(`${this.url}/${id}/leida-publicador`, {}));
  }

  marcarLeidaAdoptante(id: number): Observable<SolicitudResponse> {
    return extraerDatos(this.http.patch<ApiResponse<SolicitudResponse>>(`${this.url}/${id}/leida-adoptante`, {}));
  }
}
