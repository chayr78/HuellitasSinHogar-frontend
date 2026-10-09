import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkBase, NgbNavLinkButton, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeError } from '../../../core/http/api.util';
import { Usuario } from '../../../models/auth.model';
import { ETIQUETA_ESPECIE, ETIQUETA_ROL, ETIQUETA_TIPO_PUBLICADOR } from '../../../models/etiquetas';
import { MascotaResponse } from '../../../models/mascota.model';
import { AdminService } from '../../../services/admin.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ToastService } from '../../../services/toast.service';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { FotoMascota } from '../../../shared/components/foto-mascota/foto-mascota';
import { coincideBusqueda } from '../../../shared/utils/texto';

/** Panel de administración (/admin): pestañas de usuarios (dar de baja o reactivar) y de mascotas (dar de baja). */
@Component({
  imports: [
    RouterLink,
    NgbNav,
    NgbNavItem,
    NgbNavLinkButton,
    NgbNavLinkBase,
    NgbNavContent,
    NgbNavOutlet,
    FotoMascota,
    BadgeEstado,
  ],
  selector: 'app-admin-panel',
  styleUrl: './admin-panel.scss',
  templateUrl: './admin-panel.html',
})
export class AdminPanel implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly pestana = signal<'usuarios' | 'mascotas'>('usuarios');

  // null = todavía no se cargan (los contadores muestran "—").
  protected readonly usuarios = signal<Usuario[] | null>(null);
  protected readonly cargandoUsuarios = signal(true);
  protected readonly errorUsuarios = signal(false);
  protected readonly busquedaUsuarios = signal('');

  protected readonly mascotas = signal<MascotaResponse[] | null>(null);
  protected readonly cargandoMascotas = signal(true);
  protected readonly errorMascotas = signal(false);
  protected readonly busquedaMascotas = signal('');

  /** Id del usuario o mascota con una operación en curso. */
  protected readonly procesando = signal<number | null>(null);

  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly etiquetaTipoPublicador = ETIQUETA_TIPO_PUBLICADOR;
  protected readonly etiquetaEspecie = ETIQUETA_ESPECIE;

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarMascotas();
  }

  protected usuariosFiltrados(): Usuario[] {
    const termino = this.busquedaUsuarios();
    return (this.usuarios() ?? []).filter((u) => coincideBusqueda(termino, u.nombre, u.correo, u.ubicacion));
  }

  protected mascotasFiltradas(): MascotaResponse[] {
    const termino = this.busquedaMascotas();
    return (this.mascotas() ?? []).filter((m) => coincideBusqueda(termino, m.nombre, m.publicadorNombre));
  }

  /** No se puede dar de baja a uno mismo ni a otros administradores. */
  protected puedeCambiarEstado(usuario: Usuario): boolean {
    return usuario.id !== this.auth.usuario()?.id && usuario.rol !== 'ADMINISTRADOR';
  }

  protected leerTexto(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.errorUsuarios.set(false);
    this.adminService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargandoUsuarios.set(false);
      },
      error: () => {
        this.errorUsuarios.set(true);
        this.cargandoUsuarios.set(false);
      },
    });
  }

  protected cargarMascotas(): void {
    this.cargandoMascotas.set(true);
    this.errorMascotas.set(false);
    this.adminService.obtenerMascotas().subscribe({
      next: (mascotas) => {
        this.mascotas.set(mascotas);
        this.cargandoMascotas.set(false);
      },
      error: () => {
        this.errorMascotas.set(true);
        this.cargandoMascotas.set(false);
      },
    });
  }

  protected async cambiarEstadoUsuario(usuario: Usuario): Promise<void> {
    const activar = !usuario.activo;
    const confirmado = await this.confirm.confirmar(
      activar
        ? {
            titulo: `¿Reactivar a ${usuario.nombre}?`,
            mensaje: 'La cuenta podrá volver a iniciar sesión y usar la plataforma.',
            textoConfirmar: 'Reactivar',
          }
        : {
            titulo: `¿Dar de baja a ${usuario.nombre}?`,
            mensaje: 'La cuenta ya no podrá iniciar sesión. Podrás reactivarla más adelante.',
            textoConfirmar: 'Dar de baja',
            peligro: true,
          },
    );
    if (!confirmado) {
      return;
    }
    this.procesando.set(usuario.id);
    this.adminService.cambiarEstadoUsuario(usuario.id, activar).subscribe({
      next: () => {
        this.usuarios.update((lista) => lista?.map((u) => (u.id === usuario.id ? { ...u, activo: activar } : u)) ?? null);
        this.toast.success(activar ? `${usuario.nombre} fue reactivado.` : `${usuario.nombre} fue dado de baja.`);
        this.procesando.set(null);
      },
      error: (error: unknown) => {
        this.toast.error(mensajeError(error, 'No pudimos actualizar el usuario. Inténtalo de nuevo.'));
        this.procesando.set(null);
      },
    });
  }

  protected async eliminarMascota(mascota: MascotaResponse): Promise<void> {
    const confirmado = await this.confirm.confirmar({
      titulo: `¿Dar de baja la publicación de ${mascota.nombre}?`,
      mensaje:
        'Se eliminará la publicación y también todas sus solicitudes de adopción. Esta acción no se puede deshacer.',
      textoConfirmar: 'Dar de baja publicación',
      peligro: true,
    });
    if (!confirmado) {
      return;
    }
    this.procesando.set(mascota.id);
    this.adminService.eliminarMascota(mascota.id).subscribe({
      next: () => {
        this.mascotas.update((lista) => lista?.filter((m) => m.id !== mascota.id) ?? null);
        this.toast.success(`La publicación de ${mascota.nombre} fue dada de baja.`);
        this.procesando.set(null);
      },
      error: (error: unknown) => {
        this.toast.error(mensajeError(error, 'No pudimos dar de baja la publicación. Inténtalo de nuevo.'));
        this.procesando.set(null);
      },
    });
  }
}
