/**
 * Mini-renderizador de Markdown → HTML para el Asistente IA.
 *
 * Seguro por construcción: TODO el texto pasa por escapeHtml antes de armar
 * el HTML, así que nada de lo que venga en los datos (nombres de clientes,
 * comentarios, etc., que el modelo repite) puede inyectar etiquetas.
 *
 * Soporta lo que usa el asistente: párrafos, **negrita**, *cursiva*,
 * `código`, bloques ```code```, títulos (#..####), listas (-, 1.), tablas
 * GFM y separadores (---). Sin dependencias.
 */

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Formato inline sobre texto ya escapado: código, negrita, cursiva. */
const inline = (s: string): string =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')

/** Separa una fila de tabla "| a | b |" en celdas. */
const splitRow = (line: string): string[] => {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

const esSeparadorTabla = (line: string): boolean =>
  /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes('-') && line.includes('|')

export function renderMarkdownLite(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let parrafo: string[] = []
  let i = 0

  const cerrarParrafo = () => {
    if (parrafo.length > 0) {
      html.push(`<p>${parrafo.map(inline).join('<br>')}</p>`)
      parrafo = []
    }
  }

  while (i < lines.length) {
    const raw = lines[i] ?? ''
    const line = raw.trim()

    if (!line) {
      cerrarParrafo()
      i++
      continue
    }

    // Bloque de código ```...```
    if (line.startsWith('```')) {
      cerrarParrafo()
      const codigo: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        codigo.push(lines[i] ?? '')
        i++
      }
      i++ // cierra ```
      html.push(`<pre><code>${escapeHtml(codigo.join('\n'))}</code></pre>`)
      continue
    }

    // Tabla GFM: fila de encabezado + separador |---|
    if (line.startsWith('|') && esSeparadorTabla(lines[i + 1] ?? '')) {
      cerrarParrafo()
      const encabezado = splitRow(line)
      i += 2
      const filas: string[][] = []
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        filas.push(splitRow((lines[i] ?? '').trim()))
        i++
      }
      const thead = `<thead><tr>${encabezado.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${filas
        .map((f) => `<tr>${f.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`
      html.push(`<div class="md-tabla"><table>${thead}${tbody}</table></div>`)
      continue
    }

    // Título #..####  (arranca en h3 para no competir con los de la página)
    const titulo = /^(#{1,4})\s+(.+)$/.exec(line)
    if (titulo) {
      cerrarParrafo()
      const nivel = Math.min((titulo[1] ?? '#').length + 2, 5)
      html.push(`<h${nivel}>${inline(titulo[2] ?? '')}</h${nivel}>`)
      i++
      continue
    }

    // Separador ---
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      cerrarParrafo()
      html.push('<hr>')
      i++
      continue
    }

    // Listas (con o sin orden)
    if (/^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      cerrarParrafo()
      const ordenada = /^\d/.test(line)
      const items: string[] = []
      while (i < lines.length) {
        const t = (lines[i] ?? '').trim()
        const m = ordenada ? /^\d+[.)]\s+(.+)$/.exec(t) : /^[-*]\s+(.+)$/.exec(t)
        if (!m) break
        items.push(`<li>${inline(m[1] ?? '')}</li>`)
        i++
      }
      html.push(ordenada ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`)
      continue
    }

    parrafo.push(line)
    i++
  }

  cerrarParrafo()
  return html.join('')
}
