// Trazabilidad y métricas del sistema multiagente (ADR-017).
//
// Un único script con tres modos (la opción más simple sin perder opciones):
//   npm run metrics                       -> KPIs en consola (tabla por agente y por tarea)
//   npm run metrics -- --report           -> además escribe docs/metrics/trazabilidad.md
//   npm run metrics -- --lint             -> validación pre-flight; exit code 1 si hay violaciones
//
// Parser propio de subconjunto YAML (clave-valor, listas inline y en bloque, mapas inline).
// Sin dependencia nueva: sustituible por js-yaml sin cambiar el esquema (ADR-017 §4).
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const PROMPTS_DIR = join(ROOT, '.ai', 'prompts')
const STATUS_FILE = join(ROOT, 'docs', 'STATUS.md')
const REPORT_FILE = join(ROOT, 'docs', 'metrics', 'trazabilidad.md')

const MANDATORY_FLOW = ['product', 'architecture', 'test', 'developer', 'reviewer', 'security', 'documentation']
// Vocabulario del flujo (ADR-017 §2): fases obligatorias + director/orchestrator/knowledge cuando participan.
const AGENT_VOCABULARY = ['product', 'architecture', 'test', 'developer', 'reviewer', 'security', 'documentation', 'director', 'orchestrator', 'knowledge', 'devops']
const REQUIRED_FIELDS = ['task_id', 'date', 'agentes', 'flujo', 'estado']

type FrontMatter = {
  task_id?: string
  date?: string
  handoff_ref?: string
  agentes?: string[]
  flujo?: string[]
  artefactos?: string[]
  tests?: string[]
  cobertura?: { verdes?: number; total?: number; nuevos?: number }
  estado?: string
  rework_de?: string
  [k: string]: unknown
}

type Entry = {
  file: string
  line: number
  heading: string
  date?: string
  title?: string
  fm?: FrontMatter
  hasFm: boolean
}

// --- Parsing de front-matter (subconjunto YAML) ------------------------------------------------

function parseInlineList(raw: string): string[] {
  const inner = raw.trim()
  return inner
    .slice(1, -1)
    .split(',')
    .map((s) => s.trim().replace(/^(['"])(.*)\1$/, '$2'))
    .filter(Boolean)
}

function parseInlineMap(raw: string): Record<string, string> {
  const inner = raw.trim().slice(1, -1)
  const out: Record<string, string> = {}
  for (const part of inner.split(',')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = v
  }
  return out
}

function parseScalar(raw: string): string {
  return raw.trim().replace(/^(['"])(.*)\1$/, '$2')
}

function parseFrontMatter(text: string): FrontMatter {
  const lines = text.split('\n')
  const fm: Record<string, unknown> = {}
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '') {
      i++
      continue
    }
    const m = trimmed.match(/^([A-Za-z_][\w-]*):\s?(.*)$/)
    if (!m) {
      i++
      continue
    }
    const key = m[1]
    let rest = m[2].trim()
    if (rest.startsWith('[') && rest.endsWith(']')) {
      fm[key] = parseInlineList(rest)
    } else if (rest.startsWith('{') && rest.endsWith('}')) {
      const map = parseInlineMap(rest)
      if (key === 'cobertura') {
        fm[key] = {
          verdes: map.verdes !== undefined ? Number(map.verdes) : undefined,
          total: map.total !== undefined ? Number(map.total) : undefined,
          nuevos: map.nuevos !== undefined ? Number(map.nuevos) : undefined,
        }
      } else {
        fm[key] = map
      }
    } else if (rest === '') {
      // Bloque: lista indentada (- item) o mapa indentado (key:)
      const items: string[] = []
      let j = i + 1
      while (j < lines.length) {
        const l = lines[j]
        const listMatch = l.match(/^\s+-\s+(.*)$/)
        if (listMatch) {
          items.push(parseScalar(listMatch[1]))
          j++
          continue
        }
        const keyMatch = l.match(/^\s+([\w-]+):\s*(.*)$/)
        if (keyMatch && items.length === 0) {
          items.push(parseScalar(keyMatch[2]))
          j++
          continue
        }
        break
      }
      fm[key] = items
      i = j - 1
    } else {
      fm[key] = parseScalar(rest)
    }
    i++
  }
  return fm as FrontMatter
}

// --- División de ficheros en entradas -----------------------------------------------------------

function splitEntries(text: string, file: string): Entry[] {
  const lines = text.split('\n')
  const entries: Entry[] = []
  let i = 0
  while (i < lines.length) {
    const m = lines[i].match(/^##\s+(\d{4}-\d{2}-\d{2})\s*(?:—|-)?\s*(.*)$/)
    if (m) {
      const date = m[1]
      const title = (m[2] ?? '').trim()
      // Front-matter: bloque YAML entre dos líneas '---' por encima de la cabecera.
      // Se camina hacia arriba desde el cierre (---) validando que cada línea sea YAML
      // (clave: | lista | continuación indentada); ante prosa, no es front-matter.
      let fmText: string | null = null
      let j = i - 1
      while (j >= 0 && lines[j].trim() === '') j--
      if (j >= 0 && lines[j].trim() === '---') {
        const closer = j
        const collected: string[] = []
        let opener = -1
        let k = closer - 1
        while (k >= 0) {
          const t = lines[k].trim()
          if (t === '---') {
            opener = k
            break
          }
          if (t === '') {
            k--
            continue
          }
          if (/^[\w-]+:/.test(t) || /^-\s/.test(t) || /^\s+[-:]\s?/.test(lines[k])) {
            collected.unshift(lines[k])
            k--
            continue
          }
          break
        }
        if (opener >= 0 && collected.length > 0 && collected.some((l) => /^[\w-]+:/.test(l.trim()))) {
          fmText = collected.join('\n').trim()
        }
      }
      const fm = fmText ? parseFrontMatter(fmText) : undefined
      entries.push({ file, line: i + 1, heading: lines[i].trim(), date, title, fm, hasFm: fm !== undefined })
    }
    i++
  }
  return entries
}

function collectEntries(): Entry[] {
  const files = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith('.md'))
  const entries: Entry[] = []
  for (const file of files) {
    const text = readFileSync(join(PROMPTS_DIR, file), 'utf8')
    entries.push(...splitEntries(text, file))
  }
  return entries
}

// --- KPIs (ADR-017 §3) --------------------------------------------------------------------------

function unionOf<T>(sets: T[][]): Set<T> {
  const out = new Set<T>()
  for (const s of sets) for (const v of s) out.add(v)
  return out
}

type TaskStats = {
  taskId: string
  agentes: Set<string>
  flujo: Set<string>
  hasHandoff: boolean
  rework: boolean
  testsPresent: boolean
  coberturaDefined: boolean
  coberturaGreen: boolean
  cobertura: { verdes: number; total: number }
  entries: Entry[]
}

function buildTasks(entries: Entry[]): Map<string, TaskStats> {
  const byTask = new Map<string, Entry[]>()
  for (const e of entries) {
    if (!e.hasFm || !e.fm?.task_id) continue
    const list = byTask.get(e.fm.task_id) ?? []
    list.push(e)
    byTask.set(e.fm.task_id, list)
  }
  const tasks = new Map<string, TaskStats>()
  for (const [taskId, list] of byTask) {
    const agentes = unionOf(list.map((e) => e.fm?.agentes ?? []))
    const flujo = unionOf(list.map((e) => e.fm?.flujo ?? []))
    const cobertura = list
      .map((e) => e.fm?.cobertura)
      .find((c) => c && c.total !== undefined) ?? { verdes: 0, total: 0 }
    const coberturaDefined = list.some((e) => e.fm?.cobertura !== undefined)
    tasks.set(taskId, {
      taskId,
      agentes,
      flujo,
      hasHandoff: list.some((e) => e.fm?.handoff_ref !== undefined && e.fm.handoff_ref !== ''),
      rework: list.some((e) => e.fm?.estado === 'rework'),
      testsPresent: list.some((e) => (e.fm?.tests ?? []).length > 0),
      coberturaDefined,
      coberturaGreen:
        cobertura.total !== 0 && cobertura.verdes !== undefined && cobertura.verdes === cobertura.total,
      cobertura: { verdes: cobertura.verdes ?? 0, total: cobertura.total ?? 0 },
      entries: list,
    })
  }
  return tasks
}

function statusTaskIds(): Set<string> {
  if (!existsSync(STATUS_FILE)) return new Set()
  const text = readFileSync(STATUS_FILE, 'utf8')
  const ids = new Set<string>()
  for (const m of text.matchAll(/#(\d{1,4})\b/g)) ids.add(`STATUS-${m[1]}`)
  return ids
}

function pct(num: number, den: number): string {
  return den === 0 ? 'n/a' : `${((num / den) * 100).toFixed(1)}%`
}

function computeKpis(entries: Entry[]) {
  const tasks = buildTasks(entries)
  const T = tasks.size
  const all = [...tasks.values()]

  const handoffCompleto = all.filter((t) => t.hasHandoff).length
  const conReviewer = all.filter((t) => t.flujo.has('reviewer')).length
  const conSecurity = all.filter((t) => t.flujo.has('security')).length
  const fullFlow = all.filter((t) => {
    const s = t.flujo
    return MANDATORY_FLOW.length === s.size && MANDATORY_FLOW.every((a) => s.has(a))
  }).length
  const avgAdherence = T
    ? all.reduce((acc, t) => acc + [...t.flujo].filter((a) => MANDATORY_FLOW.includes(a)).length / MANDATORY_FLOW.length, 0) / T
    : 0
  const retrabajo = all.filter((t) => t.rework).length
  const coberturaTests = all.filter((t) => t.testsPresent).length
  const coberturaDefinida = all.filter((t) => t.coberturaDefined).length
  const coberturaVerde = all.filter((t) => t.coberturaGreen).length
  const sumVerdes = all.reduce((a, t) => a + t.cobertura.verdes, 0)
  const sumTotales = all.reduce((a, t) => a + t.cobertura.total, 0)

  // rework_por_agente: el agente que declara estado: rework
  const reworkPorAgente = new Map<string, number>()
  for (const [id, t] of tasks) {
    if (!t.rework) continue
    const declared = t.entries.filter((e) => e.fm?.estado === 'rework')
    const agents = unionOf(declared.map((e) => e.fm?.agentes ?? []))
    for (const a of agents) reworkPorAgente.set(a, (reworkPorAgente.get(a) ?? 0) + 1)
    if (agents.size === 0) reworkPorAgente.set(`(${id} sin declarar)`, (reworkPorAgente.get(`(${id} sin declarar)`) ?? 0) + 1)
  }

  // huecos_trazabilidad: task_ids en STATUS.md sin ninguna entrada
  const statusIds = statusTaskIds()
  const declaredIds = new Set(tasks.keys())
  const huecos = [...statusIds].filter((id) => !declaredIds.has(id)).sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)))

  // cobertura_agentes: por agente, tareas con entrada / tareas donde debía participar (flujo)
  const coberturaAgentes: { agent: string; num: number; den: number; pct: string }[] = []
  for (const agent of MANDATORY_FLOW) {
    const den = all.filter((t) => t.flujo.has(agent)).length
    const num = all.filter((t) => t.flujo.has(agent) && t.agentes.has(agent)).length
    coberturaAgentes.push({ agent, num, den, pct: pct(num, den) })
  }

  return {
    totalTareas: T,
    handoffCompleto: { num: handoffCompleto, pct: pct(handoffCompleto, T) },
    conReviewer: { num: conReviewer, pct: pct(conReviewer, T) },
    conSecurity: { num: conSecurity, pct: pct(conSecurity, T) },
    adherenciaFlujo: { num: fullFlow, pct: pct(fullFlow, T), parcial: `${(avgAdherence * 100).toFixed(1)}%` },
    retrabajo: { num: retrabajo, pct: pct(retrabajo, T) },
    reworkPorAgente,
    coberturaTests: { num: coberturaTests, pct: pct(coberturaTests, T) },
    coberturaDeclarada: {
      num: coberturaVerde,
      den: coberturaDefinida,
      pct: pct(coberturaVerde, coberturaDefinida),
      agregado: pct(sumVerdes, sumTotales),
    },
    huecos: { num: huecos.length, ids: huecos.slice(0, 40) },
    coberturaAgentes,
    conFm: entries.filter((e) => e.hasFm).length,
    sinFm: entries.filter((e) => !e.hasFm).length,
  }
}

// --- Lint (ADR-017 §4 --lint) -------------------------------------------------------------------

type Violation = { file: string; line: number; message: string }

function lint(entries: Entry[]): Violation[] {
  const violations: Violation[] = []
  // Un task_id se espera en varios ficheros (ADR-017 §1: una entrada por agente participante),
  // así que el duplicado solo se detecta como copia/pega: mismo fichero + task_id + fecha + título.
  const seenByFile = new Map<string, Set<string>>() // file -> "task_id|date|heading"
  const byTask = new Map<string, Entry[]>() // task_id -> entries (invariante de flujo consistente)

  for (const e of entries) {
    if (!e.hasFm || !e.fm) {
      violations.push({ file: e.file, line: e.line, message: `Entrada sin front-matter: "${e.heading}"` })
      continue
    }
    const fm = e.fm
    for (const f of REQUIRED_FIELDS) {
      if (fm[f] === undefined || fm[f] === '' || (Array.isArray(fm[f]) && fm[f].length === 0)) {
        violations.push({ file: e.file, line: e.line, message: `Falta campo obligatorio "${f}" (${e.heading})` })
      }
    }
    if (fm.task_id) {
      const key = `${fm.task_id}|${e.date}|${e.heading}`
      const fileSet = seenByFile.get(e.file) ?? new Set<string>()
      if (fileSet.has(key)) {
        violations.push({ file: e.file, line: e.line, message: `Entrada duplicada (copia/pega) en ${e.file}: "${e.heading}"` })
      } else {
        fileSet.add(key)
        seenByFile.set(e.file, fileSet)
      }
      const list = byTask.get(fm.task_id) ?? []
      list.push(e)
      byTask.set(fm.task_id, list)
    }
    const agentes = fm.agentes ?? []
    const flujo = fm.flujo ?? []
    for (const a of [...agentes, ...flujo]) {
      if (!AGENT_VOCABULARY.includes(a)) {
        violations.push({ file: e.file, line: e.line, message: `Agente "${a}" fuera del vocabulario (${e.heading})` })
      }
    }
    const agentesSet = new Set(agentes)
    for (const a of agentesSet) {
      if (!flujo.includes(a)) {
        violations.push({ file: e.file, line: e.line, message: `Invariante agentes ⊆ flujo: "${a}" ∈ agentes pero ∉ flujo (${e.heading})` })
      }
    }
    if (fm.estado === 'rework' && !fm.rework_de) {
      violations.push({ file: e.file, line: e.line, message: `estado: rework sin rework_de (${e.heading})` })
    }
    if (fm.date && !/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) {
      violations.push({ file: e.file, line: e.line, message: `date "${fm.date}" no es YYYY-MM-DD (${e.heading})` })
    }
  }

  // ADR-017 §1: todas las entradas de un mismo task_id declaran el mismo flujo (propiedad de la tarea).
  for (const [taskId, list] of byTask) {
    const first = new Set(list[0].fm?.flujo ?? [])
    for (const e of list.slice(1)) {
      const other = new Set(e.fm?.flujo ?? [])
      const same = first.size === other.size && [...first].every((v) => other.has(v))
      if (!same) {
        violations.push({
          file: e.file,
          line: e.line,
          message: `flujo inconsistente con otras entradas de ${taskId} (${[...other].sort().join(', ')})`,
        })
      }
    }
  }
  return violations
}

// --- Salida -------------------------------------------------------------------------------------

function fmtList(values: (string | number)[] | undefined): string {
  if (!values || values.length === 0) return '-'
  return values.length > 6 ? `${values.slice(0, 6).join(', ')}… (+${values.length - 6})` : values.join(', ')
}

function buildReport(entries: Entry[]): string {
  const k = computeKpis(entries)
  const lines: string[] = []
  lines.push('# Métricas de Trazabilidad (ADR-017)', '')
  lines.push(`Reporte generado por \`npm run metrics -- --report\` — ver [ADR-017](../ADR/ADR-017_trazabilidad_y_metricas.md).`, '')
  lines.push(`Fecha de ejecución: ${new Date().toISOString().slice(0, 10)}`, '')
  lines.push(`Entradas analizadas: **${k.conFm}** con front-matter / **${k.sinFm}** sin (total ${k.conFm + k.sinFm})`, '')
  lines.push(`Tareas (task_id) distintas: **${k.totalTareas}**`, '')
  lines.push('', '## KPIs globales', '')
  lines.push('| KPI | Valor |')
  lines.push('|---|---|')
  lines.push(`| % tareas con handoff (\`handoff_ref\`) | ${k.handoffCompleto.pct} (${k.handoffCompleto.num}/${k.totalTareas}) |`)
  lines.push(`| % con Reviewer | ${k.conReviewer.pct} (${k.conReviewer.num}/${k.totalTareas}) |`)
  lines.push(`| % con Security | ${k.conSecurity.pct} (${k.conSecurity.num}/${k.totalTareas}) |`)
  lines.push(`| Adherencia al flujo completo (7 fases) | ${k.adherenciaFlujo.pct} (${k.adherenciaFlujo.num}/${k.totalTareas}); solape medio ${k.adherenciaFlujo.parcial} |`)
  lines.push(`| Tasa de retrabajo | ${k.retrabajo.pct} (${k.retrabajo.num}/${k.totalTareas}) |`)
  lines.push(`| Cobertura de tests declarados | ${k.coberturaTests.pct} (${k.coberturaTests.num}/${k.totalTareas}) |`)
  lines.push(`| Cobertura declarada (verdes = total) | ${k.coberturaDeclarada.pct} (${k.coberturaDeclarada.num}/${k.coberturaDeclarada.den}); agregado Σ ${k.coberturaDeclarada.agregado} |`)
  lines.push(`| Huecos de trazabilidad (STATUS.md sin entrada) | ${k.huecos.num} — ${fmtList(k.huecos.ids)} |`)
  lines.push('')
  lines.push('> `cobertura_real%` (cobertura de código con `@vitest/coverage-v8`) es un **target futuro** declarado en ADR-017 §3, no instrumentado aún.', '')
  lines.push('', '## Rework por agente que lo detecta', '')
  lines.push('| Agente | Tareas en rework |')
  lines.push('|---|---|')
  for (const [a, n] of k.reworkPorAgente) lines.push(`| ${a} | ${n} |`)
  lines.push('', '## Cobertura de agentes (tareas con entrada / tareas donde el flujo lo exigía)', '')
  lines.push('| Agente | Num | Den | % |')
  lines.push('|---|---|---|---|')
  for (const c of k.coberturaAgentes) lines.push(`| ${c.agent} | ${c.num} | ${c.den} | ${c.pct} |`)
  return lines.join('\n')
}

function printConsole(entries: Entry[]): void {
  const k = computeKpis(entries)
  console.log(`\nEntradas con front-matter: ${k.conFm} | sin: ${k.sinFm} | tareas: ${k.totalTareas}\n`)
  const rows: [string, string][] = [
    ['handoff completo', `${k.handoffCompleto.pct} (${k.handoffCompleto.num}/${k.totalTareas})`],
    ['con Reviewer', `${k.conReviewer.pct} (${k.conReviewer.num}/${k.totalTareas})`],
    ['con Security', `${k.conSecurity.pct} (${k.conSecurity.num}/${k.totalTareas})`],
    ['adherencia flujo completo', `${k.adherenciaFlujo.pct} (${k.adherenciaFlujo.num}/${k.totalTareas}) — solape medio ${k.adherenciaFlujo.parcial}`],
    ['tasa de retrabajo', `${k.retrabajo.pct} (${k.retrabajo.num}/${k.totalTareas})`],
    ['cobertura tests declarados', `${k.coberturaTests.pct} (${k.coberturaTests.num}/${k.totalTareas})`],
    ['cobertura declarada', `${k.coberturaDeclarada.pct} (${k.coberturaDeclarada.num}/${k.coberturaDeclarada.den}) — agregado ${k.coberturaDeclarada.agregado}`],
    ['huecos de trazabilidad', `${k.huecos.num} — ${fmtList(k.huecos.ids)}`],
  ]
  const width = Math.max(...rows.map(([r]) => r.length)) + 2
  for (const [kpi, val] of rows) console.log(`${kpi.padEnd(width)}${val}`)
  console.log('\nCobertura de agentes:')
  for (const c of k.coberturaAgentes) console.log(`  ${c.agent.padEnd(14)} ${c.num}/${c.den} (${c.pct})`)
  console.log(`\nRework por agente: ${Object.entries(Object.fromEntries(k.reworkPorAgente)).map(([a, n]) => `${a}=${n}`).join(', ') || '-'}`)
}

function main(): void {
  const args = process.argv.slice(2)
  const entries = collectEntries()

  if (args.includes('--lint')) {
    const violations = lint(entries)
    for (const v of violations) console.log(`[lint] ${v.file}:${v.line} — ${v.message}`)
    if (violations.length > 0) {
      console.log(`\n${violations.length} violaciones — trazabilidad NO válida.`)
      process.exit(1)
    }
    console.log('Lint de trazabilidad OK: todo el front-matter es válido (ADR-017 §4).')
    process.exit(0)
  }

  if (args.includes('--report')) {
    mkdirSync(dirname(REPORT_FILE), { recursive: true })
    writeFileSync(REPORT_FILE, buildReport(entries), 'utf8')
    console.log(`Reporte escrito en ${REPORT_FILE}`)
  }

  printConsole(entries)
}

main()
