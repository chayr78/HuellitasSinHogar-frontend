/** Prepara un texto para buscar: sin acentos, en minúsculas y sin espacios al inicio o al final. */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** True si el término está vacío o aparece en alguno de los campos (sin importar acentos ni mayúsculas). */
export function coincideBusqueda(termino: string, ...campos: (string | null | undefined)[]): boolean {
  const buscado = normalizar(termino);
  return !buscado || campos.some((campo) => normalizar(campo).includes(buscado));
}
