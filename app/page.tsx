'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, ChevronDown, ClipboardCheck, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { ThemeToggle } from '@/components/theme-toggle'
import { criteria, criterioKey, EVALUACION_COOKIE, ratings, rubros } from '@/lib/evaluacion'

function BrandMark() {
  return <div className="brand-mark" aria-label="Corporación Salvadoreña de Turismo">
      <svg className="seal-svg" viewBox="160 0 145 130" role="img" aria-label="Escudo de El Salvador rodeado de estrellas">
      <image className="seal-light" href="/corsatur-logo.png" x="0" y="0" width="400" height="130" preserveAspectRatio="none" />
      <image className="seal-dark" href="/corsatur-logo-dark.png" x="0" y="0" width="400" height="130" preserveAspectRatio="none" />
    </svg>
    <div className="brand-name">CORPORACIÓN SALVADOREÑA<br /><strong>DE TURISMO</strong></div>
  </div>
}

export default function Page() {
  const reduce = useReducedMotion() ?? false
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const [alreadySent, setAlreadySent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const answered = Object.keys(answers).length
  const total = useMemo(() => criteria.reduce((n, section) => n + section.items.length, 0), [])
  const progress = Math.round((answered / total) * 100)
  const update = (key: string, value: string) => { setAnswers((current) => ({ ...current, [key]: value })); setSent(false) }

  const reveal = (delay = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: reduce ? 0.15 : 0.55, delay, ease: 'easeOut' as const },
  })
  const introContainer = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 } } }
  const introItem = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.5, ease: 'easeOut' as const } },
  }
  const listVariants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }
  const groupVariants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.45, ease: 'easeOut' as const } },
  }

  useEffect(() => {
    const enviada = document.cookie.split(';').some((item) => item.trim() === `${EVALUACION_COOKIE}=1`)
    if (enviada) { setSent(true); setAlreadySent(true) }
  }, [])

  const clearSentCookie = () => {
    document.cookie = `${EVALUACION_COOKIE}=; Max-Age=0; Path=/`
  }

  const resetForm = () => {
    formRef.current?.reset()
    setAnswers({})
    setSent(false)
    setAlreadySent(false)
    setError('')
    setErrors({})
    clearSentCookie()
  }

  const clearFieldError = (event: ChangeEvent<HTMLFormElement>) => {
    const name = (event.target as unknown as HTMLInputElement).name
    if (!name) return

    setError((current) => (current ? '' : current))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const validate = (data: FormData) => {
    const next: Record<string, string> = {}
    const obligatorios: [string, string][] = [
      ['actividad', 'Ingrese el nombre de la actividad.'],
      ['lugar', 'Ingrese el lugar de la actividad.'],
      ['fecha', 'Seleccione la fecha de la actividad.'],
      ['municipio', 'Indique el CDT o municipio.'],
      ['genero', 'Seleccione una opción.'],
      ['participaria', 'Seleccione una opción.'],
      ['previa', 'Seleccione una opción.'],
      ['recomendaciones', 'Escriba sus recomendaciones.'],
    ]

    obligatorios.forEach(([name, message]) => {
      if (!String(data.get(name) ?? '').trim()) next[name] = message
    })

    const rubrosSeleccionados = data.getAll('rubro')
    if (rubrosSeleccionados.length === 0) {
      next.rubro = 'Seleccione al menos un rubro.'
    } else if (rubrosSeleccionados.includes('Otro') && !String(data.get('otro') ?? '').trim()) {
      next.otro = 'Complete el campo Específico.'
    }

    criteria.forEach((section, groupIndex) => {
      section.items.forEach((_, itemIndex) => {
        const key = criterioKey(groupIndex, itemIndex)
        if (!String(data.get(key) ?? '').trim()) next[key] = 'Seleccione una opción.'
      })
    })

    return next
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending || alreadySent) return

    const form = event.currentTarget
    const data = new FormData(form)
    const validationErrors = validate(data)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setError('Complete los campos obligatorios marcados.')
      const firstKey = Object.keys(validationErrors)[0]
      form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus()
      return
    }

    setErrors({})
    setError('')
    const respuestas: Record<string, string> = {}

    criteria.forEach((section, groupIndex) => {
      section.items.forEach((_, itemIndex) => {
        const key = criterioKey(groupIndex, itemIndex)
        const value = data.get(key)
        if (typeof value === 'string' && value) respuestas[key] = value
      })
    })

    const payload = {
      actividad: String(data.get('actividad') ?? ''),
      lugar: String(data.get('lugar') ?? ''),
      fechaActividad: String(data.get('fecha') ?? ''),
      municipio: String(data.get('municipio') ?? ''),
      rubros: data.getAll('rubro').map(String),
      otro: String(data.get('otro') ?? ''),
      genero: String(data.get('genero') ?? ''),
      respuestas,
      participaria: String(data.get('participaria') ?? ''),
      previa: String(data.get('previa') ?? ''),
      recomendaciones: String(data.get('recomendaciones') ?? ''),
    }

    setSending(true)
    setError('')

    try {
      const response = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || 'No se pudo enviar la evaluación. Intente de nuevo.')
      }

      form.reset()
      setAnswers({})
      setSent(true)
      setAlreadySent(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar la evaluación. Intente de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return <main className="page-shell">
    <header className="topbar"><div className="topbar-inner"><BrandMark /><div className="topbar-meta"><span className="secure-label"><span className="secure-dot" /> FORMULARIO INSTITUCIONAL</span><div className="doc-meta"><span>Código: <strong>FO-GPL-01</strong></span><span>Fecha: <strong>28/10/2022</strong></span><span>No. Página: <strong>1/1</strong></span></div><ThemeToggle /></div></div></header>
    <div className="form-wrap">
      <motion.div className="intro" initial="hidden" animate="show" variants={introContainer}>
        <motion.div className="eyebrow" variants={introItem}>PROCESO DE PLANEACIÓN ESTRATÉGICA</motion.div>
        <motion.h1 className="official-title" variants={introItem}>Medición de satisfacción de actividades con <em>Comités de Desarrollo Turístico</em> o empresas.</motion.h1>
      </motion.div>
      <form ref={formRef} onSubmit={handleSubmit} onChange={clearFieldError} noValidate>
        <motion.section className="meta-card" {...reveal()}><div className="meta-title"><div><span className="section-number">01</span><h2>Información de la actividad</h2></div></div>
          <div className="fields-grid">
            <label className="field wide">Nombre de la actividad<input id="actividad" name="actividad" placeholder="Ej. Taller de desarrollo turístico" required aria-invalid={Boolean(errors.actividad)} />{errors.actividad && <span className="field-error">{errors.actividad}</span>}</label>
            <label className="field">Lugar de actividad<input name="lugar" placeholder="Municipio, departamento" aria-invalid={Boolean(errors.lugar)} />{errors.lugar && <span className="field-error">{errors.lugar}</span>}</label>
            <label className="field">Fecha de actividad<input name="fecha" type="date" aria-invalid={Boolean(errors.fecha)} />{errors.fecha && <span className="field-error">{errors.fecha}</span>}</label>
            <label className="field wide">CDT o municipio que representa<input name="municipio" placeholder="Escriba su respuesta" aria-invalid={Boolean(errors.municipio)} />{errors.municipio && <span className="field-error">{errors.municipio}</span>}</label>
            <fieldset className="field wide"><legend>Rubro o sector que representa</legend><div className="checks">{rubros.map((item) => <label key={item} className="check-label"><input type="checkbox" name="rubro" value={item} />{item}</label>)}<label className="other-input"><span>Específico:</span><input name="otro" aria-label="Especifique el rubro específico" aria-invalid={Boolean(errors.otro)} /></label></div>{errors.rubro && <span className="field-error">{errors.rubro}</span>}{errors.otro && <span className="field-error">{errors.otro}</span>}</fieldset>
            <fieldset className="field wide"><legend>Género</legend><div className="checks"><label className="check-label"><input type="radio" name="genero" value="Femenino" />Femenino</label><label className="check-label"><input type="radio" name="genero" value="Masculino" />Masculino</label></div>{errors.genero && <span className="field-error">{errors.genero}</span>}</fieldset>
          </div>
        </motion.section>
        <motion.section className="rating-section" {...reveal(0.03)}><div className="rating-heading"><div><span className="section-number">02</span><h2>Cuéntenos cómo le fue</h2></div><span className="required-note">Seleccione una opción por criterio</span></div>
          <div className="instructions"><strong>INDICACIONES:</strong><span> Con el objetivo de elevar la calidad de las acciones desarrolladas para fortalecer los comités de desarrollo turístico y las empresas, se desea conocer su apreciación sobre la actividad desarrollada. Por favor, marque con una "X" la opción que mejor refleje su valoración en cada criterio.</span></div>
          <div className="progress-wrap"><div className="progress-label"><span>Progreso de evaluación</span><span>{answered} de {total} respondidos</span></div><div className="progress-track"><motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20 }} /></div></div>
          <motion.div className="rating-list" variants={listVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>{criteria.map((section, sectionIndex) => <motion.div className="criterion-group" key={section.group} variants={groupVariants}><div className="group-label"><span>0{sectionIndex + 1}</span>{section.group}</div><div className="criterion-rows">{section.items.map((item, itemIndex) => { const key = criterioKey(sectionIndex, itemIndex); return <div className="criterion-row" key={key}><div className="criterion-label"><p>{item}</p>{errors[key] && <span className="field-error">{errors[key]}</span>}</div><div className={`rating-options ${errors[key] ? 'invalid' : ''}`} role="radiogroup" aria-label={item} aria-invalid={Boolean(errors[key])}>{ratings.map((rating, index) => <motion.label key={rating} className={`rating-choice ${answers[key] === rating ? 'selected' : ''}`} whileTap={reduce ? undefined : { scale: 0.97 }}><input type="radio" name={key} value={rating} checked={answers[key] === rating} onChange={() => update(key, rating)} aria-label={rating} /><motion.span className="rating-number" animate={{ scale: answers[key] === rating && !reduce ? 1.08 : 1 }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 18 }}>{['10', '9–8', '7', '6', '≤5'][index]}</motion.span><span className="rating-name">{rating.split(' (')[0]}</span></motion.label>)}</div></div> })}</div>          </motion.div>)}</motion.div>
        </motion.section>
        <motion.section className="extra-card" {...reveal(0.04)}><div className="extra-title"><span className="section-number">03</span><h2>Una última pregunta</h2></div><div className="participation-row"><p>¿Participaría en otra actividad como esta?</p><div className="segmented"><label><input type="radio" name="participaria" value="Sí" />Sí</label><label><input type="radio" name="participaria" value="No" />No</label></div></div>{errors.participaria && <span className="field-error participation-error">{errors.participaria}</span>}<div className="participation-row"><p>¿Ha participado en otras actividades de CORSATUR?</p><div className="segmented"><label><input type="radio" name="previa" value="Sí" />Sí</label><label><input type="radio" name="previa" value="No" />No</label></div></div>{errors.previa && <span className="field-error participation-error">{errors.previa}</span>}<label className="field comments-label">Recomendaciones o aspectos que sugiere mejorar<textarea name="recomendaciones" rows={4} placeholder="Sus comentarios son importantes para nosotros…" aria-invalid={Boolean(errors.recomendaciones)} />{errors.recomendaciones && <span className="field-error">{errors.recomendaciones}</span>}</label></motion.section>
        <motion.div className="form-actions" {...reveal(0.04)}><motion.button className="reset-button" type="button" onClick={resetForm} whileTap={reduce ? undefined : { scale: 0.96 }}><RotateCcw size={15} /> Limpiar formulario</motion.button><div className="primary-actions"><motion.button className="submit-button" type="submit" disabled={sending || alreadySent} whileHover={sending || alreadySent || reduce ? undefined : { y: -1 }} whileTap={sending || alreadySent || reduce ? undefined : { scale: 0.98 }}><AnimatePresence mode="wait" initial={false}><motion.span key={sending ? 'sending' : 'idle'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduce ? 0 : 0.15 }}>{sending ? 'Enviando…' : 'Enviar evaluación'}</motion.span></AnimatePresence> <span className="submit-arrow">↗</span></motion.button></div></motion.div>
        <AnimatePresence initial={false}>
          {error && <motion.div key={error} className="error-message" role="alert" initial={{ opacity: 0, y: -6 }} animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduce ? 0.15 : 0.3, ease: 'easeOut' }}>{error}</motion.div>}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {sent && <motion.div key="success" className="success-message" role="status" initial={{ opacity: 0, y: 10, scale: reduce ? 1 : 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 22 }}><Check size={18} /> <span>Su respuesta se envió correctamente. Gracias por compartir su opinión.</span>{alreadySent && <button className="again-button" type="button" onClick={resetForm}>Enviar otra evaluación</button>}</motion.div>}
        </AnimatePresence>
      </form>
      <footer><div className="footer-rule" /><div className="footer-content"><div><BrandMark /><p>Edificio Century Tower, nivel 10 · Boulevard Sergio Vieira de Mello No. 243<br />San Salvador, El Salvador · www.corsatur.gob.sv</p></div><span className="footer-right">CORSATUR <b>·</b> GESTIÓN TURÍSTICA<br /><small>PROCESO DE PLANEACIÓN ESTRATÉGICA</small></span></div></footer>
    </div>
  </main>
}
