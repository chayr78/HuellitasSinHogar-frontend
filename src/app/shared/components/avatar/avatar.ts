import { Component, Input, signal } from '@angular/core';

/** Foto circular de una persona. Si no hay foto o no carga, muestra sus iniciales. */
@Component({
  imports: [],
  selector: 'app-avatar',
  styleUrl: './avatar.scss',
  templateUrl: './avatar.html',
})
export class Avatar {
  @Input() set fotoUrl(valor: string | null | undefined) {
    this.foto.set(valor?.trim() ? valor : null);
    this.fallo.set(false);
  }
  @Input() nombre: string | null | undefined = '';
  /** Lado del círculo en píxeles. */
  @Input() tamano = 36;

  protected readonly foto = signal<string | null>(null);
  /** True si la imagen no se pudo cargar. */
  protected readonly fallo = signal(false);

  /** Iniciales del nombre (máximo 2). */
  protected iniciales(): string {
    const partes = (this.nombre ?? '').trim().split(/\s+/).filter(Boolean);
    return partes
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }
}
