'use client'

import { useMemo, useState } from 'react'
import { ArrowDownToLine, Check, ChevronDown, ClipboardCheck, RotateCcw } from 'lucide-react'

const criteria = [
  { group: 'Organización', items: ['La convocatoria se realizó con suficiente tiempo', 'Las indicaciones proporcionadas al inicio fueron oportunas', 'La actividad se desarrolló en orden y de acuerdo con los objetivos', 'Los objetivos de la actividad fueron claros'] },
  { group: 'Contenido', items: ['La información fue oportuna y de calidad', 'Los conocimientos y experiencias adquiridos pueden implementarse en sus actividades'] },
  { group: 'Facilitador', items: ['Conoce sobre la temática desarrollada', 'Se promovió la interacción del grupo', 'Se evacuaron las preguntas y dudas de los participantes', 'Manejó adecuadamente el tiempo de la actividad'] },
  { group: 'Valoración general', items: ['¿Se adecúa a sus necesidades el servicio recibido?', '¿Cuál es su nivel de satisfacción con el servicio recibido?', '¿Cómo evalúa la imagen de la institución (CORSATUR)?'] },
]
const ratings = ['Excelente (10)', 'Muy bueno (9–8)', 'Bueno (7)', 'Regular (6)', 'Deficiente (5 o menos)']
const rubros = ['Alimentación', 'Alojamiento', 'Información', 'Transporte', 'Recreación', 'Otro']

function BrandMark() {
  return <div className="brand-mark" aria-label="Corporación Salvadoreña de Turismo">
      <svg className="seal-svg" viewBox="160 0 145 130" role="img" aria-label="Escudo de El Salvador rodeado de estrellas">
      <image href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VsJ1uAcHswj0cac7QIdmcbCQVv10zM.png" x="0" y="0" width="400" height="130" preserveAspectRatio="none" />
    </svg>
    <div className="brand-name">CORPORACIÓN SALVADOREÑA<br /><strong>DE TURISMO</strong></div>
  </div>
}

export default function Page() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const answered = Object.keys(answers).length
  const total = useMemo(() => criteria.reduce((n, section) => n + section.items.length, 0), [])
  const progress = Math.round((answered / total) * 100)
  const update = (key: string, value: string) => { setAnswers((current) => ({ ...current, [key]: value })); setSent(false) }
  const download = () => {
    const data = new Blob([JSON.stringify({ actividad: (document.getElementById('actividad') as HTMLInputElement).value, respuestas: answers }, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(data)
    const link = document.createElement('a'); link.href = href; link.download = 'evaluacion-turismo.json'; link.click(); URL.revokeObjectURL(href)
  }

  return <main className="page-shell">
    <header className="topbar"><div className="topbar-inner"><BrandMark /><div className="topbar-meta"><span className="secure-label"><span className="secure-dot" /> FORMULARIO INSTITUCIONAL</span><div className="doc-meta"><span>Código: <strong>FO-GPL-01</strong></span><span>Fecha: <strong>28/10/2022</strong></span></div></div></div></header>
    <div className="form-wrap">
      <div className="intro"><div className="eyebrow">EVALUACIÓN DE ACTIVIDADES</div><h1>Su opinión nos ayuda<br /><em>a mejorar.</em></h1><p>Comparta su experiencia. Sus respuestas contribuyen a fortalecer la calidad del desarrollo turístico y empresarial.</p></div>
      <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
        <section className="meta-card"><div className="meta-title"><div><span className="section-number">01</span><h2>Información de la actividad</h2></div></div>
          <div className="fields-grid"><label className="field wide">Nombre de la actividad<input id="actividad" name="actividad" placeholder="Ej. Taller de desarrollo turístico" required /></label><label className="field wide">Lugar de actividad<input name="lugar" placeholder="Municipio, departamento" /></label><label className="field">Fecha de actividad<input name="fecha" type="date" /></label><label className="field">CDT o municipio que representa<input name="municipio" placeholder="Escriba su respuesta" /></label>
          <fieldset className="field wide"><legend>Rubro o sector que representa</legend><div className="checks">{rubros.map((item) => <label key={item} className="check-label"><input type="checkbox" name="rubro" value={item} />{item}</label>)}<label className="other-input"><span>Especifique:</span><input name="otro" aria-label="Especifique otro rubro" /></label></div></fieldset>
          <fieldset className="field wide"><legend>Género</legend><div className="checks"><label className="check-label"><input type="radio" name="genero" value="Femenino" />Femenino</label><label className="check-label"><input type="radio" name="genero" value="Masculino" />Masculino</label><label className="check-label"><input type="radio" name="genero" value="Prefiero no decir" />Prefiero no decir</label></div></fieldset></div>
        </section>
        <section className="rating-section"><div className="rating-heading"><div><span className="section-number">02</span><h2>Cuéntenos cómo le fue</h2></div><span className="required-note">Seleccione una opción por criterio</span></div>
          <div className="instructions"><strong>INDICACIONES</strong><span> Para cada aspecto, marque la opción que mejor represente su valoración.</span></div>
          <div className="progress-wrap"><div className="progress-label"><span>Progreso de evaluación</span><span>{answered} de {total} respondidos</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>
          <div className="rating-list">{criteria.map((section, sectionIndex) => <div className="criterion-group" key={section.group}><div className="group-label"><span>0{sectionIndex + 1}</span>{section.group}</div><div className="criterion-rows">{section.items.map((item, itemIndex) => { const key = `${section.group}-${itemIndex}`; return <div className="criterion-row" key={key}><p>{item}</p><div className="rating-options" role="radiogroup" aria-label={item}>{ratings.map((rating, index) => <label key={rating} className={`rating-choice ${answers[key] === rating ? 'selected' : ''}`}><input type="radio" name={key} value={rating} checked={answers[key] === rating} onChange={() => update(key, rating)} aria-label={rating} /><span className="rating-number">{['10', '9–8', '7', '6', '≤5'][index]}</span><span className="rating-name">{rating.split(' (')[0]}</span></label>)}</div></div> })}</div></div>)}</div>
        </section>
        <section className="extra-card"><div className="extra-title"><span className="section-number">03</span><h2>Una última pregunta</h2></div><div className="participation-row"><p>¿Participaría en otra actividad como esta?</p><div className="segmented"><label><input type="radio" name="participaria" value="Sí" />Sí</label><label><input type="radio" name="participaria" value="No" />No</label></div></div><div className="participation-row"><p>¿Ha participado en otras actividades de CORSATUR?</p><div className="segmented"><label><input type="radio" name="previa" value="Sí" />Sí</label><label><input type="radio" name="previa" value="No" />No</label></div></div><label className="field comments-label">Recomendaciones o aspectos que sugiere mejorar<textarea name="recomendaciones" rows={4} placeholder="Sus comentarios son importantes para nosotros…" /></label></section>
        <div className="form-actions"><button className="reset-button" type="reset" onClick={() => { setAnswers({}); setSent(false) }}><RotateCcw size={15} /> Limpiar formulario</button><div className="primary-actions"><button className="download-button" type="button" onClick={download}><ArrowDownToLine size={16} /> Descargar</button><button className="submit-button" type="submit">Enviar evaluación <span>↗</span></button></div></div>
        {sent && <div className="success-message" role="status"><Check size={18} /> Evaluación registrada. Gracias por compartir su opinión.</div>}
      </form>
      <footer><div className="footer-rule" /><div className="footer-content"><div><BrandMark /><p>Edificio Century Tower, nivel 10 · Boulevard Sergio Vieira de Mello No. 243<br />San Salvador, El Salvador · www.corsatur.gob.sv</p></div><span className="footer-right">CORSATUR <b>·</b> GESTIÓN TURÍSTICA<br /><small>PROCESO DE PLANEACIÓN ESTRATÉGICA</small></span></div></footer>
    </div>
  </main>
}
