export type CriterioGrupo = { group: string; items: string[] }

export const criteria: CriterioGrupo[] = [
  { group: 'Organización', items: ['La convocatoria se realizó con suficiente tiempo', 'Las indicaciones proporcionadas al inicio fueron oportunas', 'La actividad se desarrolló en orden y de acuerdo con los objetivos', 'Los objetivos de la actividad fueron claros'] },
  { group: 'Contenido', items: ['La información fue oportuna y de calidad', 'Los conocimientos y experiencias adquiridos pueden implementarse en sus actividades'] },
  { group: 'Facilitador', items: ['Conoce sobre la temática desarrollada', 'Se promovió la interacción del grupo', 'Se evacuaron las preguntas y dudas de los participantes', 'Manejó adecuadamente el tiempo de la actividad'] },
  { group: 'Valoración general', items: ['¿Se adecúa a sus necesidades el servicio recibido?', '¿Cuál es su nivel de satisfacción con el servicio recibido?', '¿Cómo evalúa la imagen de la institución (CORSATUR)?'] },
]

export const ratings = ['Excelente (10)', 'Muy bueno (9–8)', 'Bueno (7)', 'Regular (6)', 'Deficiente (5 o menos)']

export const rubros = ['Alimentación', 'Alojamiento', 'Información', 'Transporte', 'Recreación', 'Otro']

export const EVALUACION_COOKIE = 'corsatur_evaluacion_enviada'
export const EVALUACION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function criterioKey(groupIndex: number, itemIndex: number) {
  return `${criteria[groupIndex].group}-${itemIndex}`
}

export const COLUMNAS = [
  'Fecha de envío (UTC)',
  'Fecha de envío (El Salvador)',
  'Nombre de la actividad',
  'Lugar de actividad',
  'Fecha de actividad',
  'CDT o municipio',
  'Rubros',
  'Otro rubro',
  'Género',
  ...criteria.flatMap((section) => section.items.map((item) => `${section.group}: ${item}`)),
  '¿Participaría en otra actividad?',
  '¿Ha participado antes?',
  'Recomendaciones',
]

export type EvaluacionPayload = {
  actividad: string
  lugar: string
  fechaActividad: string
  municipio: string
  rubros: string[]
  otro: string
  genero: string
  respuestas: Record<string, string>
  participaria: string
  previa: string
  recomendaciones: string
}
