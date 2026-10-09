import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';
import { AuthService } from './auth.service';

// Un 401 en estas rutas no significa "sesión vencida": son credenciales incorrectas
// o la validación del token al arrancar (AuthService.cargarSesion ya limpia la sesión).
const RUTAS_SIN_REDIRECCION = ['/auth/login', '/auth/registro', '/auth/me'];

/** Agrega el token a las peticiones del backend y cierra la sesión si el servidor responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const esApi = req.url.startsWith(API_URL);
  const token = auth.token();

  const peticion = esApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      const ruta = req.url.slice(API_URL.length);
      if (
        esApi &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !RUTAS_SIN_REDIRECCION.some((r) => ruta.startsWith(r))
      ) {
        const returnUrl = router.url;
        auth.logout();
        router.navigate(['/login'], { queryParams: returnUrl.startsWith('/login') ? {} : { returnUrl } });
      }
      return throwError(() => error);
    }),
  );
};
