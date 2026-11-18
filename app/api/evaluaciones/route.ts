import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  COLUMNAS,
  criteria,
  criterioKey,
  EVALUACION_COOKIE,
  EVALUACION_COOKIE_MAX_AGE,
  ratings,
  type EvaluacionPayload,
} from '@/lib/evaluacion'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  actividad: z.string().trim().min(1, 'La actividad es obligatoria').max(200),
  lugar: z.string().trim().min(1, 'El lugar es obligatorio').max(200),
  fechaActividad: z.string().trim().min(1, 'La fecha es obligatoria').max(20),
  municipio: z.string().trim().min(1, 'El municipio es obligatorio').max(200),
  rubros: z.array(z.string().trim().max(60)).min(1, 'Seleccione al menos un rubro').max(10),
  otro: z.string().trim().max(200).default(''),
  genero: z.string().trim().min(1, 'El género es obligatorio').max(50),
  respuestas: z.record(z.string(), z.string()).default({}),
  participaria: z.string().trim().min(1, 'Indique si participaría').max(10),
  previa: z.string().trim().min(1, 'Indique si ha participado antes').max(10),
  recomendaciones: z.string().trim().min(1, 'Las recomendaciones son obligatorias').max(2000),
})

function columnLetter(count: number) {
  let letter = ''
  let n = count
  while (n > 0) {
    const remainder = (n - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

function quoteSheetName(name: string) {
  return `'${name.replace(/'/g, "''")}'`
}

function normalizeSheetName(value: string) {
  const raw = value.includes('!') ? value.split('!')[0] : value
  const trimmed = raw.trim()
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'")
  }
  return trimmed
}

function buildRow(payload: EvaluacionPayload) {
  const now = new Date()
  const respuestasValidas: Record<string, string> = {}

  criteria.forEach((section, groupIndex) => {
    section.items.forEach((_, itemIndex) => {
      const key = criterioKey(groupIndex, itemIndex)
      const value = payload.respuestas[key]
      if (value && ratings.includes(value)) respuestasValidas[key] = value
    })
  })

  const respuestasFila = criteria.flatMap((section, groupIndex) =>
    section.items.map((_, itemIndex) => respuestasValidas[criterioKey(groupIndex, itemIndex)] ?? ''),
  )

  let fechaLocal = now.toISOString()
  try {
    fechaLocal = now.toLocaleString('es-SV', { timeZone: 'America/El_Salvador' })
  } catch {
    // Fallback a UTC si el runtime no tiene datos de la zona horaria.
  }

  return [
    now.toISOString(),
    fechaLocal,
    payload.actividad,
    payload.lugar,
    payload.fechaActividad,
    payload.municipio,
    payload.rubros.join(', '),
    payload.otro,
    payload.genero,
    ...respuestasFila,
    payload.participaria,
    payload.previa,
    payload.recomendaciones,
  ]
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error('Faltan variables de entorno de Google Sheets')
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId,
  }
}

async function resolveSheetName(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
) {
  const configured = process.env.GOOGLE_SHEET_RANGE
  if (configured && configured.trim()) return normalizeSheetName(configured)

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  })
  const title = meta.data.sheets?.[0]?.properties?.title
  if (!title) throw new Error('El spreadsheet no tiene pestañas')
  return title
}

async function ensureHeaders(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  headerRange: string,
) {
  const current = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange })
  const firstRow = current.data.values?.[0] ?? []

  if (firstRow.some((cell) => String(cell).trim() !== '')) return

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: headerRange,
    valueInputOption: 'RAW',
    requestBody: { values: [COLUMNAS] },
  })
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 50_000) {
    return errorResponse('La solicitud es demasiado grande.', 413)
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return errorResponse('El cuerpo de la solicitud no es válido.', 400)
  }

  const parsed = payloadSchema.safeParse(json)
  if (!parsed.success) {
    return errorResponse('Datos inválidos.', 400)
  }

  const payload = parsed.data as EvaluacionPayload
  const criteriosSinResponder = criteria.flatMap((section, groupIndex) =>
    section.items
      .map((_, itemIndex) => criterioKey(groupIndex, itemIndex))
      .filter((key) => !ratings.includes(payload.respuestas[key] ?? '')),
  )

  if (criteriosSinResponder.length > 0) {
    return errorResponse('Debe responder todos los criterios.', 400)
  }

  if (payload.rubros.includes('Otro') && !payload.otro) {
    return errorResponse('Debe especificar el otro rubro.', 400)
  }

  const row = buildRow(payload)

  try {
    const { sheets, spreadsheetId } = await getSheetsClient()
    const sheetName = await resolveSheetName(sheets, spreadsheetId)
    const quotedSheetName = quoteSheetName(sheetName)
    const headerRange = `${quotedSheetName}!A1:${columnLetter(COLUMNAS.length)}1`

    await ensureHeaders(sheets, spreadsheetId, headerRange)

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${quotedSheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })

    const response = NextResponse.json({ ok: true })
    response.cookies.set(EVALUACION_COOKIE, '1', {
      path: '/',
      maxAge: EVALUACION_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
    return response
  } catch (error) {
    console.error(
      'No se pudo guardar la evaluación:',
      error instanceof Error ? error.message : 'error desconocido',
    )
    return errorResponse('No se pudo guardar la evaluación. Intente de nuevo.', 500)
  }
}
