import { Component, OnInit, inject, signal } from '@angular/core';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import {
  ESPECIES,
  ETIQUETA_ESPECIE_PLURAL,
  ETIQUETA_TAMANO,
  TAMANOS,
} from '../../../models/etiquetas';
import { Especie, MascotaResponse, Tamano } from '../../../models/mascota.model';
import { BusquedaService } from '../../../services/busqueda.service';
import { MascotaService } from '../../../services/mascota.service';
import { MascotaCard } from '../../../shared/components/mascota-card/mascota-card';
import { coincideBusqueda } from '../../../shared/utils/texto';

type FiltroTamano = Tamano | 'TODOS';
type FiltroEspecie = Especie | 'TODAS';

interface Opcion<T> {
  valor: T;
  etiqueta: string;
}

/** Catálogo público (página de inicio): lista de mascotas con filtros y el buscador del navbar. */
@Component({
  imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem, MascotaCard],
  selector: 'app-catalogo-list',
  templateUrl: './catalogo-list.html',
})
export class CatalogoList implements OnInit {
  private readonly mascotaService = inject(MascotaService);
  private readonly busqueda = inject(BusquedaService);

  protected readonly mascotas = signal<MascotaResponse[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  /** Petición en curso, para cancelarla si se vuelve a cargar (botón "Reintentar") antes de que responda. */
  private carga: Subscription | null = null;

  protected readonly filtroTamano = signal<FiltroTamano>('TODOS');
  protected readonly filtroEspecie = signal<FiltroEspecie>('TODAS');

  protected readonly opcionesTamano: Opcion<FiltroTamano>[] = [
    { valor: 'TODOS', etiqueta: 'Todos' },
    ...TAMANOS.map((tamano) => ({ valor: tamano, etiqueta: ETIQUETA_TAMANO[tamano] })),
  ];
  protected readonly opcionesEspecie: Opcion<FiltroEspecie>[] = [
    { valor: 'TODAS', etiqueta: 'Perros y gatos' },
    ...ESPECIES.map((especie) => ({ valor: especie, etiqueta: ETIQUETA_ESPECIE_PLURAL[especie] })),
  ];

  ngOnInit(): void {
    this.cargar();
  }

  /** Mascotas que cumplen los filtros y la búsqueda. */
  protected mascotasFiltradas(): MascotaResponse[] {
    const tamano = this.filtroTamano();
    const especie = this.filtroEspecie();
    const termino = this.busqueda.termino();

    return this.mascotas().filter(
      (m) =>
        (tamano === 'TODOS' || m.tamano === tamano) &&
        (especie === 'TODAS' || m.especie === especie) &&
        coincideBusqueda(termino, m.nombre, m.publicadorNombre),
    );
  }

  protected etiquetaDe<T>(opciones: Opcion<T>[], valor: T): string {
    return opciones.find((o) => o.valor === valor)?.etiqueta ?? '';
  }

  /** El catálogo muestra solo las mascotas disponibles. */
  protected cargar(): void {
    const peticion = this.mascotaService.obtenerDisponibles();

    this.carga?.unsubscribe();
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.mascotas.set([]);
    this.carga = peticion.subscribe({
      next: (mascotas) => {
        this.mascotas.set(mascotas);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }
}
