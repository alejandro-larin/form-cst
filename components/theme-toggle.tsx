'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('corsatur-theme', next ? 'dark' : 'light')
    } catch {
      // Sin persistencia si el navegador bloquea localStorage.
    }
  }

  const label = dark ? 'Activar modo claro' : 'Activar modo oscuro'

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
