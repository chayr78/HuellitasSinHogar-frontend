// Preguntas de la encuesta de compatibilidad. Solo tipoVivienda y horasDisponibles afectan el cálculo; el resto es informativo.
import { RespuestasEncuesta } from '../../../models/solicitud.model';

export type ClavePregunta = keyof RespuestasEncuesta;
export type ValorRespuesta = string | boolean;

export interface PreguntaEncuesta {
  clave: ClavePregunta;
  texto: string;
  opciones: { valor: ValorRespuesta; etiqueta: string }[];
}

const SI_NO = [
  { valor: true, etiqueta: 'Sí' },
  { valor: false, etiqueta: 'No' },
];

export const PREGUNTAS_ENCUESTA: PreguntaEncuesta[] = [
  {
    clave: 'tipoVivienda',
    texto: '¿En qué tipo de vivienda vives?',
    opciones: [
      { valor: 'DEPTO_SIN_PATIO', etiqueta: 'Departamento o casa sin patio' },
      { valor: 'PATIO_PEQUENO', etiqueta: 'Casa con patio pequeño' },
      { valor: 'PATIO_GRANDE', etiqueta: 'Casa con patio grande' },
    ],
  },
  {
    clave: 'horasDisponibles',
    texto: '¿Cuántas horas tienes disponibles al día?',
    opciones: [
      { valor: 'MENOS_2H', etiqueta: 'Menos de 2 horas' },
      { valor: 'DE_2_A_5H', etiqueta: 'De 2 a 5 horas' },
      { valor: 'MAS_5H', etiqueta: 'Más de 5 horas' },
    ],
  },
  { clave: 'experienciaPrevia', texto: '¿Tienes experiencia previa con mascotas?', opciones: SI_NO },
  { clave: 'ninosPequenos', texto: '¿Hay niños pequeños en casa?', opciones: SI_NO },
  { clave: 'otrasMascotas', texto: '¿Viven otras mascotas contigo?', opciones: SI_NO },
];
