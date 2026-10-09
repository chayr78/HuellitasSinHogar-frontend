import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const LONGITUD_MINIMA_PASSWORD = 8;

/** Validador de grupo: marca `passwordsDistintas` si los dos campos no coinciden. */
export function passwordsCoinciden(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor: unknown = grupo.get(campo)?.value;
    const repetido: unknown = grupo.get(confirmacion)?.value;
    return valor && repetido && valor !== repetido ? { passwordsDistintas: true } : null;
  };
}
