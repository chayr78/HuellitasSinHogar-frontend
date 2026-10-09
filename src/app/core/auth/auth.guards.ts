import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../../models/auth.model';
import { ToastService } from '../../services/toast.service';
import { AuthService } from './auth.service';

/** Exige sesión iniciada; si no, manda a /login recordando a dónde quería ir. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.estaAutenticado()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Exige uno de los roles indicados. Úsalo después de authGuard. */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.rol();
    if (!auth.estaAutenticado() || rol === null) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    if (roles.includes(rol)) {
      return true;
    }
    inject(ToastService).error('No tienes permiso para ver esa página.');
    return router.createUrlTree(['/']);
  };
}

/** Para login y registro: si ya hay sesión, manda a la pantalla de inicio del rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaAutenticado() ? inject(Router).parseUrl(auth.rutaInicio()) : true;
};
