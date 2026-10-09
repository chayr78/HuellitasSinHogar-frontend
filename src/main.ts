// ng-bootstrap usa $localize para sus textos internos (por ejemplo en los toasts); sin esta línea la app falla al mostrar un aviso.
import '@angular/localize/init';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
