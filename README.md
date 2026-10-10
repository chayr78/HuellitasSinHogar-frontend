# Huellitas sin Hogar — Frontend

Aplicación web (Angular) de **Huellitas sin Hogar**, una plataforma de adopción de mascotas: catálogo de mascotas, encuesta de compatibilidad, solicitudes de adopción, panel para publicadores y panel de administración.

## Requisitos

- **Node.js** 22.22.3+ o 24.15+ (recomendado: Node 24 LTS)
- **npm** (incluido con Node)
- **Angular CLI** 22 (opcional de forma global: `npm install -g @angular/cli`; también puede usarse con `npx ng`)

## Correr en local

```bash
npm install
npm start          # equivale a ng serve
```

Abre `http://localhost:4200/`. En local, la app consume el backend en `http://localhost:8080/api`, así que el backend debe estar corriendo en ese puerto.

## Build de producción

```bash
npm run build      # equivale a ng build (configuración de producción)
```

La salida queda en `dist/huellitas-frontend/browser`.

## Backend

La URL de la API se define en un solo lugar: `src/app/core/config/api.config.ts`.

- En `localhost` / `127.0.0.1`: `http://localhost:8080/api`
- En cualquier otro dominio (producción): `https://huellitassinhogar-production-4c97.up.railway.app/api`

## Despliegue en Netlify

El archivo `netlify.toml` ya configura el comando de build, la carpeta a publicar, la versión de Node (24) y la redirección `/* → /index.html` para que las rutas de Angular funcionen al recargar la página.
