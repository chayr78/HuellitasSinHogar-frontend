import { Component } from '@angular/core';

/**
 * Huella dibujada en SVG (marca del sitio y placeholders). Toma el color del texto (currentColor)
 * y el tamaño del contenedor; por defecto mide 1em.
 */
@Component({
  selector: 'app-icono-huella',
  host: { 'aria-hidden': 'true' },
  styles: ':host { display: inline-block; width: 1em; height: 1em; line-height: 0; } svg { width: 100%; height: 100%; }',
  template: `
    <svg viewBox="0 0 32 32" fill="currentColor" focusable="false">
      <ellipse cx="7.2" cy="13.4" rx="3.1" ry="3.9" transform="rotate(-18 7.2 13.4)" />
      <ellipse cx="12.6" cy="7.6" rx="3.2" ry="4.1" transform="rotate(-6 12.6 7.6)" />
      <ellipse cx="19.4" cy="7.6" rx="3.2" ry="4.1" transform="rotate(6 19.4 7.6)" />
      <ellipse cx="24.8" cy="13.4" rx="3.1" ry="3.9" transform="rotate(18 24.8 13.4)" />
      <path
        d="M16 15.2c-2.6 0-4.4 2.2-5.9 4.4-1.3 1.9-3.3 3.1-3.3 5.4 0 2.1 1.7 3.6 3.8 3.6 1.9 0 3.3-.9 5.4-.9s3.5.9 5.4.9c2.1 0 3.8-1.5 3.8-3.6 0-2.3-2-3.5-3.3-5.4-1.5-2.2-3.3-4.4-5.9-4.4Z"
      />
    </svg>
  `,
})
export class IconoHuella {}
