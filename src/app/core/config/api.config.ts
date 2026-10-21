// El frontend siempre usa el backend de Railway, también al correrlo en local
// (npm start). Para usar un backend local, cambia API_URL por 'http://localhost:8080/api'.
const BACKEND_PRODUCCION = 'https://huellitassinhogar-production-4c97.up.railway.app/api';

/** URL base del backend de Huellitas sin Hogar. */
export const API_URL = BACKEND_PRODUCCION;
