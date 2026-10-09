import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarEstadoService } from './core/services/navbar-estado.service';
import { Footer } from './shared/components/footer/footer';
import { Navbar } from './shared/components/navbar/navbar';
import { ToastContainer } from './shared/components/toast-container/toast-container';

/** Componente raíz: navbar, avisos (toasts), la página actual y el footer. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ToastContainer, Footer],
  templateUrl: './app.html',
  // Columna flex de al menos el alto de la ventana: el footer queda abajo en páginas cortas.
  styles: ':host { display: flex; flex-direction: column; min-height: 100vh; }',
})
export class App {
  protected readonly navbarEstado = inject(NavbarEstadoService);
}
