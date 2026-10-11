import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ESPECIES,
  ETIQUETA_ESPECIE_PLURAL,
  ETIQUETA_SEXO,
  ETIQUETA_TAMANO,
  ICONO_SEXO,
  SEXOS,
  TAMANOS,
} from '../../../models/etiquetas';
import { Especie, MascotaResponse, Sexo, Tamano } from '../../../models/mascota.model';
import { MascotaService } from '../../../services/mascota.service';
import { IconoHuella } from '../../../shared/components/icono-huella/icono-huella';
import { MascotaCard } from '../../../shared/components/mascota-card/mascota-card';

type FiltroTamano = Tamano | 'TODOS';
type FiltroEspecie = Especie | 'TODAS';
type FiltroSexo = Sexo | 'TODOS';

interface Opcion<T> {
  valor: T;
  etiqueta: string;
  icono?: string;
}

/**
 * Catálogo público: lista de mascotas con filtros.
 * Los filtros viven en la URL (?especie=PERRO&sexo=HEMBRA&tamano=CHICO) para poder compartir el enlace o llegar desde Inicio.
 */
@Component({
  imports: [MascotaCard, IconoHuella],
  selector: 'app-catalogo-list',
  styleUrl: './catalogo-list.scss',
  templateUrl: './catalogo-list.html',
})
export class CatalogoList implements OnInit {
  private readonly mascotaService = inject(MascotaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mascotas = signal<MascotaResponse[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  /** Petición en curso, para cancelarla si se vuelve a cargar (botón "Reintentar") antes de que responda. */
  private carga: Subscription | null = null;

  protected readonly filtroTamano = signal<FiltroTamano>('TODOS');
  protected readonly filtroEspecie = signal<FiltroEspecie>('TODAS');
  protected readonly filtroSexo = signal<FiltroSexo>('TODOS');

  protected readonly opcionesTamano: Opcion<FiltroTamano>[] = [
    { valor: 'TODOS', etiqueta: 'Todos los tamaños' },
    ...TAMANOS.map((tamano) => ({ valor: tamano, etiqueta: ETIQUETA_TAMANO[tamano] })),
  ];
  protected readonly opcionesEspecie: Opcion<FiltroEspecie>[] = [
    { valor: 'TODAS', etiqueta: 'Perros y gatos' },
    ...ESPECIES.map((especie) => ({ valor: especie, etiqueta: ETIQUETA_ESPECIE_PLURAL[especie] })),
  ];

  protected readonly opcionesSexo: Opcion<FiltroSexo>[] = [
    { valor: 'TODOS', etiqueta: 'Machos y hembras' },
    ...SEXOS.map((sexo) => ({ valor: sexo, etiqueta: ETIQUETA_SEXO[sexo], icono: ICONO_SEXO[sexo] })),
  ];

  ngOnInit(): void {
    // La URL manda: se leen los filtros al entrar y cada vez que cambian (p. ej. con atrás/adelante).
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const especie = params.get('especie') as Especie | null;
      const tamano = params.get('tamano') as Tamano | null;
      const sexo = params.get('sexo') as Sexo | null;
      this.filtroEspecie.set(especie && ESPECIES.includes(especie) ? especie : 'TODAS');
      this.filtroTamano.set(tamano && TAMANOS.includes(tamano) ? tamano : 'TODOS');
      this.filtroSexo.set(sexo && SEXOS.includes(sexo) ? sexo : 'TODOS');
    });
    this.cargar();
  }

  /** Mascotas que cumplen los filtros. */
  protected mascotasFiltradas(): MascotaResponse[] {
    const tamano = this.filtroTamano();
    const especie = this.filtroEspecie();
    const sexo = this.filtroSexo();

    return this.mascotas().filter(
      (m) =>
        (tamano === 'TODOS' || m.tamano === tamano) &&
        (especie === 'TODAS' || m.especie === especie) &&
        (sexo === 'TODOS' || m.sexo === sexo),
    );
  }

  protected hayFiltros(): boolean {
    return this.filtroTamano() !== 'TODOS' || this.filtroEspecie() !== 'TODAS' || this.filtroSexo() !== 'TODOS';
  }

  /** Escribe los filtros en la URL; el cambio de la URL actualiza las señales. "Todos" se quita de la URL. */
  protected cambiarFiltros(cambios: { especie?: FiltroEspecie; sexo?: FiltroSexo; tamano?: FiltroTamano }): void {
    const queryParams: Record<string, string | null> = {};
    if (cambios.especie !== undefined) {
      queryParams['especie'] = cambios.especie === 'TODAS' ? null : cambios.especie;
    }
    if (cambios.sexo !== undefined) {
      queryParams['sexo'] = cambios.sexo === 'TODOS' ? null : cambios.sexo;
    }
    if (cambios.tamano !== undefined) {
      queryParams['tamano'] = cambios.tamano === 'TODOS' ? null : cambios.tamano;
    }
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected limpiarFiltros(): void {
    this.cambiarFiltros({ especie: 'TODAS', sexo: 'TODOS', tamano: 'TODOS' });
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
