import { Routes } from '@angular/router';

import { authGuard, invitadoGuard, rolGuard } from './core/auth/auth.guards';

const TITULO = 'Huellitas sin Hogar';

export const routes: Routes = [
  // Públicas
  {
    path: '',
    loadComponent: () => import('./features/inicio/home/home').then((m) => m.Home),
    title: `${TITULO} | Adopta en Tecámac`,
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./features/catalogo/catalogo-list/catalogo-list').then((m) => m.CatalogoList),
    title: `Catálogo | ${TITULO}`,
  },
  {
    path: 'mascotas/:id',
    loadComponent: () => import('./features/catalogo/mascota-detail/mascota-detail').then((m) => m.MascotaDetail),
    title: `Conoce a tu próxima mascota | ${TITULO}`,
  },
  {
    path: 'mascotas/:id/encuesta',
    loadComponent: () =>
      import('./features/mascotas/encuesta-compatibilidad/encuesta-compatibilidad').then((m) => m.EncuestaCompatibilidad),
    title: `Encuesta de compatibilidad | ${TITULO}`,
  },
  {
    path: 'adoptados',
    loadComponent: () => import('./features/catalogo/adoptados/adoptados').then((m) => m.Adoptados),
    title: `Historias felices | ${TITULO}`,
  },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: `Iniciar sesión | ${TITULO}`,
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
    title: `Crear cuenta | ${TITULO}`,
  },
  {
    path: 'olvide-password',
    loadComponent: () => import('./features/auth/olvide-password/olvide-password').then((m) => m.OlvidePassword),
    title: `Recuperar contraseña | ${TITULO}`,
  },
  {
    path: 'restablecer',
    loadComponent: () =>
      import('./features/auth/restablecer-password/restablecer-password').then((m) => m.RestablecerPassword),
    title: `Nueva contraseña | ${TITULO}`,
  },

  // Cualquier usuario con sesión
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
    title: `Mi perfil | ${TITULO}`,
  },

  // ADOPTANTE
  {
    path: 'mascotas/:id/solicitud',
    canActivate: [authGuard, rolGuard('ADOPTANTE')],
    loadComponent: () =>
      import('./features/mascotas/solicitud-adopcion/solicitud-adopcion').then((m) => m.SolicitudAdopcion),
    title: `Solicitud de adopción | ${TITULO}`,
  },
  {
    path: 'mis-solicitudes',
    canActivate: [authGuard, rolGuard('ADOPTANTE')],
    loadComponent: () => import('./features/mascotas/mis-solicitudes/mis-solicitudes').then((m) => m.MisSolicitudes),
    title: `Mis solicitudes | ${TITULO}`,
  },

  // PUBLICADOR
  {
    path: 'panel',
    canActivate: [authGuard, rolGuard('PUBLICADOR')],
    loadComponent: () => import('./features/panel/panel-publicador/panel-publicador').then((m) => m.PanelPublicador),
    title: `Mi panel | ${TITULO}`,
  },
  {
    path: 'panel/nueva',
    canActivate: [authGuard, rolGuard('PUBLICADOR')],
    loadComponent: () => import('./features/panel/publicar-mascota/publicar-mascota').then((m) => m.PublicarMascota),
    title: `Publicar mascota | ${TITULO}`,
  },
  {
    path: 'panel/editar/:id',
    canActivate: [authGuard, rolGuard('PUBLICADOR')],
    loadComponent: () => import('./features/panel/publicar-mascota/publicar-mascota').then((m) => m.PublicarMascota),
    title: `Editar mascota | ${TITULO}`,
  },

  // ADMINISTRADOR
  {
    path: 'admin',
    canActivate: [authGuard, rolGuard('ADMINISTRADOR')],
    loadComponent: () => import('./features/admin/admin-panel/admin-panel').then((m) => m.AdminPanel),
    title: `Administración | ${TITULO}`,
  },

  { path: '**', redirectTo: '' },
];
