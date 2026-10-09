export interface NotificacionItem {
  solicitudId: number;
  mascotaId: number;
  mascotaNombre: string;
  mensaje: string;
  fecha: string;
}

export interface ResumenNotificaciones {
  noLeidas: number;
  items: NotificacionItem[];
}
