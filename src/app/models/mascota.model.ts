export type Especie = 'PERRO' | 'GATO';
export type Tamano = 'CHICO' | 'MEDIANO' | 'GRANDE';
export type NivelEnergia = 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoMascota = 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADO';
export type TipoPublicador = 'REFUGIO' | 'PARTICULAR';
export type Sexo = 'MACHO' | 'HEMBRA';

export interface MascotaResponse {
  id: number;
  nombre: string;
  publicadorId: number;
  publicadorNombre: string;
  tipoPublicador: TipoPublicador;
  ubicacionPublicador: string;
  especie: Especie;
  /** Puede venir null en mascotas publicadas antes de que existiera el campo. */
  sexo?: Sexo | null;
  edadAproximada: string;
  fotoUrl: string | null;
  tamano: Tamano;
  nivelEnergia: NivelEnergia;
  descripcion: string;
  estado: EstadoMascota;
  fechaPublicacion: string;
  publicadorFotoUrl: string | null;
  /** Fotos extra en orden. Solo GET /mascotas/{id} las trae; en los listados viene vacía. */
  fotosAdicionales?: string[];
}

/** Cuerpo de POST /mascotas y PUT /mascotas/{id}. El publicador se toma del token. */
export interface MascotaRequest {
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  edadAproximada: string;
  fotoUrl: string | null;
  tamano: Tamano;
  nivelEnergia: NivelEnergia;
  descripcion: string;
  /** Máximo 5 URLs. En PUT: si no se envía no se tocan; con [] se borran. */
  fotosAdicionales?: string[];
}
