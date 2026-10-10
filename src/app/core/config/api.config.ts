// La URL se elige según el host donde corre la app: en local apunta al backend
// de desarrollo y en cualquier otro dominio (Netlify) al backend de Railway.
// Así no hace falta tocar angular.json ni usar archivos environment.
const BACKEND_LOCAL = 'http://localhost:8080/api';
const BACKEND_PRODUCCION = 'https://huellitassinhogar-production-4c97.up.railway.app/api';

const esLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

/** URL base del backend de Huellitas sin Hogar. */
export const API_URL = esLocal ? BACKEND_LOCAL : BACKEND_PRODUCCION;
