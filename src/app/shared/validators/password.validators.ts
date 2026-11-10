import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const LONGITUD_MINIMA_PASSWORD = 8;

const PATRON_MAYUSCULA = /\p{Lu}/u;
/** Cualquier carácter que no sea letra, número ni espacio. */
const PATRON_CARACTER_ESPECIAL = /[^\p{L}\p{M}\p{N}\s]/u;

/** Marca `passwordDebil` si le falta una mayúscula o un carácter especial. Vacío pasa. */
export const passwordSegura: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }
  const texto = String(control.value);
  return PATRON_MAYUSCULA.test(texto) && PATRON_CARACTER_ESPECIAL.test(texto) ? null : { passwordDebil: true };
};

/** Validador de grupo: marca `passwordsDistintas` si los dos campos no coinciden. */
export function passwordsCoinciden(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor: unknown = grupo.get(campo)?.value;
    const repetido: unknown = grupo.get(confirmacion)?.value;
    return valor && repetido && valor !== repetido ? { passwordsDistintas: true } : null;
  };
}
