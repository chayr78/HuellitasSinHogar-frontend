/**
 * Arma el enlace de wa.me para abrir un chat de WhatsApp con el texto ya escrito.
 * Quita todo lo que no sea dígito; a un número de 10 dígitos le antepone la lada 52 y uno de 12 que ya empieza
 * con 52 se deja igual. Cualquier otro número devuelve null.
 */
export function enlaceWhatsapp(telefono: string | null | undefined, texto: string): string | null {
  const digitos = (telefono ?? '').replace(/\D/g, '');

  let numero: string;
  if (digitos.length === 10) {
    numero = '52' + digitos;
  } else if (digitos.length === 12 && digitos.startsWith('52')) {
    numero = digitos;
  } else {
    return null;
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
