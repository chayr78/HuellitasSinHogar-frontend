import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/** Letras (con acentos y ñ), espacios, punto, apóstrofo y guion. Sin números ni otros símbolos. */
const PATRON_NOMBRE = /^[\p{L}\p{M}\s.'-]+$/u;
/** Lo mismo, más dígitos: solo para nombres de refugio. */
const PATRON_NOMBRE_REFUGIO = /^[\p{L}\p{M}\d\s.'-]+$/u;
/** Dígitos con un + inicial opcional; se permiten espacios, guiones y paréntesis como separadores. */
const PATRON_TELEFONO = /^\+?[\d\s()-]+$/;
/** Algo@dominio.terminación: `Validators.email` acepta "ana@correo" sin dominio. Igual que Textos.PATRON_CORREO del backend. */
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

const MIN_DIGITOS_TELEFONO = 10;
const MAX_DIGITOS_TELEFONO = 15;

/**
 * Marca `nombreInvalido` si el texto trae números o símbolos, o tiene menos de dos letras.
 * Un campo vacío se deja pasar (de eso se encarga `Validators.required`), pero uno con solo espacios no.
 */
export const nombreValido: ValidatorFn = (control) => validarNombre(control, PATRON_NOMBRE);

/** Como `nombreValido`, pero también acepta números (p. ej. "Refugio Patitas 24"). */
export const nombreRefugioValido: ValidatorFn = (control) => validarNombre(control, PATRON_NOMBRE_REFUGIO);

function validarNombre(control: AbstractControl, patron: RegExp): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const texto = String(control.value).trim();
  const letras = texto.match(/\p{L}/gu)?.length ?? 0;
  return patron.test(texto) && letras >= 2 ? null : { nombreInvalido: true };
}

/** Marca `email` (el mismo error que `Validators.email`) si el correo no es válido o no tiene terminación. Vacío pasa. */
export const correoValido: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }
  const texto = String(control.value).trim();
  return Validators.email(control) === null && PATRON_CORREO.test(texto) ? null : { email: true };
};

/** Marca `telefonoInvalido` si trae letras o símbolos, no tiene entre 10 y 15 dígitos o son todos cero. Vacío pasa. */
export const telefonoValido: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }
  const texto = String(control.value).trim();
  const digitos = texto.replace(/\D/g, '').length;
  const valido =
    PATRON_TELEFONO.test(texto) && digitos >= MIN_DIGITOS_TELEFONO && digitos <= MAX_DIGITOS_TELEFONO && /[1-9]/.test(texto);
  return valido ? null : { telefonoInvalido: true };
};
