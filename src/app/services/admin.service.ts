import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../core/config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Usuario } from '../models/auth.model';
import { MascotaResponse } from '../models/mascota.model';
import { extraerDatos } from '../core/http/api.util';

/** Llamadas HTTP del panel de administración (/admin/...). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin`;

  obtenerUsuarios(): Observable<Usuario[]> {
    return extraerDatos(this.http.get<ApiResponse<Usuario[]>>(`${this.url}/usuarios`));
  }

  obtenerMascotas(): Observable<MascotaResponse[]> {
    return extraerDatos(this.http.get<ApiResponse<MascotaResponse[]>>(`${this.url}/mascotas`));
  }

  cambiarEstadoUsuario(id: number, activo: boolean): Observable<Usuario> {
    return extraerDatos(this.http.patch<ApiResponse<Usuario>>(`${this.url}/usuarios/${id}/estado`, { activo }));
  }

  eliminarMascota(id: number): Observable<void> {
    return extraerDatos(this.http.delete<ApiResponse<void>>(`${this.url}/mascotas/${id}`));
  }
}
