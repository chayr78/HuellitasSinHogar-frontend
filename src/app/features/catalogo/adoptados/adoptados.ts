import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MascotaResponse } from '../../../models/mascota.model';
import { MascotaService } from '../../../services/mascota.service';
import { MascotaCard } from '../../../shared/components/mascota-card/mascota-card';

/** "Historias felices" (/adoptados): mascotas que ya encontraron hogar. */
@Component({
  imports: [MascotaCard, RouterLink],
  selector: 'app-adoptados',
  styleUrl: './adoptados.scss',
  templateUrl: './adoptados.html',
})
export class Adoptados implements OnInit {
  private readonly mascotaService = inject(MascotaService);

  protected readonly adoptados = signal<MascotaResponse[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotaService.obtenerAdoptados().subscribe({
      next: (mascotas) => {
        this.adoptados.set(mascotas);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }
}
