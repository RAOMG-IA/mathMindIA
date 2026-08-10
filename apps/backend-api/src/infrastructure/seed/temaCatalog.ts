import type { Tema } from '@mathmind/shared-domain'

// Catalogo real de ADR-006 ("Catalogo inicial"), transcrito tal cual -- mismos code/label/
// academicLevels/prerequisites que la tabla del ADR. Sustituye al seed minimo de 1 Tema que
// vivia antes en main.ts (documentado alli como "no es el catalogo real"). TemaRepository sigue
// en memoria a proposito (ver ADR-006, "no es un agregado mutable desde la Application layer")
// -- esto solo completa el seed que faltaba, no cambia esa decision.
export const TEMA_CATALOG: readonly Tema[] = [
  // Aritmetica (arit)
  {
    code: 'arit.suma-resta',
    area: 'arit',
    label: 'Suma y resta',
    description: 'Operaciones basicas de suma y resta mental',
    academicLevels: [
      { level: 'Primaria', difficultyRange: { min: 500, max: 750 } },
      { level: 'Secundaria', difficultyRange: { min: 800, max: 900 } },
    ],
  },
  {
    code: 'arit.multiplicacion-division',
    area: 'arit',
    label: 'Multiplicacion y division',
    description: 'Operaciones de multiplicacion y division mental',
    academicLevels: [
      { level: 'Primaria', difficultyRange: { min: 700, max: 950 } },
      { level: 'Secundaria', difficultyRange: { min: 850, max: 1000 } },
    ],
    prerequisites: ['arit.suma-resta'],
  },
  {
    code: 'arit.fracciones',
    area: 'arit',
    label: 'Fracciones',
    description: 'Suma, simplificacion y conversion de fracciones',
    academicLevels: [
      { level: 'Primaria', difficultyRange: { min: 900, max: 1150 } },
      { level: 'Secundaria', difficultyRange: { min: 1000, max: 1200 } },
    ],
    prerequisites: ['arit.multiplicacion-division'],
  },
  {
    code: 'arit.decimales',
    area: 'arit',
    label: 'Decimales',
    description: 'Operaciones con numeros decimales',
    academicLevels: [
      { level: 'Primaria', difficultyRange: { min: 850, max: 1100 } },
      { level: 'Secundaria', difficultyRange: { min: 950, max: 1150 } },
    ],
    prerequisites: ['arit.fracciones'],
  },
  {
    code: 'arit.porcentajes',
    area: 'arit',
    label: 'Porcentajes',
    description: 'Calculo de porcentajes',
    academicLevels: [
      { level: 'Secundaria', difficultyRange: { min: 1150, max: 1350 } },
      { level: 'Bachillerato', difficultyRange: { min: 1250, max: 1400 } },
    ],
    prerequisites: ['arit.decimales'],
  },
  {
    code: 'arit.potencias-raices',
    area: 'arit',
    label: 'Potencias y raices',
    description: 'Calculo de potencias y raices',
    academicLevels: [
      { level: 'Secundaria', difficultyRange: { min: 1200, max: 1400 } },
      { level: 'Bachillerato', difficultyRange: { min: 1350, max: 1550 } },
    ],
    prerequisites: ['arit.multiplicacion-division'],
  },
  {
    code: 'arit.estimacion',
    area: 'arit',
    label: 'Estimacion y orden de magnitud',
    description: 'Estimacion rapida y orden de magnitud de un resultado',
    academicLevels: [
      { level: 'Bachillerato', difficultyRange: { min: 1500, max: 1700 } },
      { level: 'Ingenieria', difficultyRange: { min: 1700, max: 1900 } },
    ],
    prerequisites: ['arit.potencias-raices'],
  },

  // Algebra (alg)
  {
    code: 'alg.expresiones',
    area: 'alg',
    label: 'Expresiones algebraicas basicas',
    description: 'Simplificacion y evaluacion de expresiones algebraicas basicas',
    academicLevels: [{ level: 'Secundaria', difficultyRange: { min: 1150, max: 1350 } }],
    prerequisites: ['arit.potencias-raices'],
  },
  {
    code: 'alg.ecuaciones-lineales',
    area: 'alg',
    label: 'Ecuaciones lineales',
    description: 'Resolucion de ecuaciones lineales de una incognita',
    academicLevels: [
      { level: 'Secundaria', difficultyRange: { min: 1250, max: 1450 } },
      { level: 'Bachillerato', difficultyRange: { min: 1350, max: 1500 } },
    ],
    prerequisites: ['alg.expresiones'],
  },
  {
    code: 'alg.ecuaciones-cuadraticas',
    area: 'alg',
    label: 'Ecuaciones cuadraticas',
    description: 'Resolucion de ecuaciones cuadraticas',
    academicLevels: [{ level: 'Bachillerato', difficultyRange: { min: 1550, max: 1750 } }],
    prerequisites: ['alg.ecuaciones-lineales'],
  },
  {
    code: 'alg.sistemas-ecuaciones',
    area: 'alg',
    label: 'Sistemas de ecuaciones',
    description: 'Resolucion de sistemas de ecuaciones lineales',
    academicLevels: [{ level: 'Bachillerato', difficultyRange: { min: 1600, max: 1800 } }],
    prerequisites: ['alg.ecuaciones-lineales'],
  },
  {
    code: 'alg.algebra-lineal-basica',
    area: 'alg',
    label: 'Algebra lineal basica',
    description: 'Determinantes 2x2/3x3 y producto escalar, calculo mental aplicado',
    academicLevels: [{ level: 'Ingenieria', difficultyRange: { min: 1900, max: 2100 } }],
    prerequisites: ['alg.sistemas-ecuaciones'],
  },

  // Geometria (geo)
  {
    code: 'geo.perimetros-areas',
    area: 'geo',
    label: 'Perimetros y areas',
    description: 'Calculo de perimetros y areas de figuras basicas',
    academicLevels: [
      { level: 'Primaria', difficultyRange: { min: 800, max: 1050 } },
      { level: 'Secundaria', difficultyRange: { min: 1000, max: 1200 } },
    ],
    prerequisites: ['arit.multiplicacion-division'],
  },
  {
    code: 'geo.angulos',
    area: 'geo',
    label: 'Angulos',
    description: 'Medida y relaciones entre angulos',
    academicLevels: [
      { level: 'Primaria', difficultyRange: { min: 850, max: 1050 } },
      { level: 'Secundaria', difficultyRange: { min: 1000, max: 1150 } },
    ],
  },
  {
    code: 'geo.pitagoras',
    area: 'geo',
    label: 'Teorema de Pitagoras',
    description: 'Aplicacion del teorema de Pitagoras',
    academicLevels: [{ level: 'Secundaria', difficultyRange: { min: 1250, max: 1450 } }],
    prerequisites: ['geo.perimetros-areas'],
  },
  {
    code: 'geo.trigonometria',
    area: 'geo',
    label: 'Trigonometria basica',
    description: 'Razones trigonometricas basicas',
    academicLevels: [{ level: 'Bachillerato', difficultyRange: { min: 1500, max: 1700 } }],
    prerequisites: ['geo.angulos'],
  },

  // Estadistica y Probabilidad (est)
  {
    code: 'est.medidas-centrales',
    area: 'est',
    label: 'Media, mediana, moda',
    description: 'Calculo de medidas de tendencia central',
    academicLevels: [{ level: 'Secundaria', difficultyRange: { min: 1150, max: 1350 } }],
    prerequisites: ['arit.decimales'],
  },
  {
    code: 'est.probabilidad-basica',
    area: 'est',
    label: 'Probabilidad basica',
    description: 'Calculo de probabilidades basicas',
    academicLevels: [
      { level: 'Secundaria', difficultyRange: { min: 1250, max: 1450 } },
      { level: 'Bachillerato', difficultyRange: { min: 1400, max: 1550 } },
    ],
    prerequisites: ['arit.fracciones'],
  },
  {
    code: 'est.combinatoria',
    area: 'est',
    label: 'Combinatoria',
    description: 'Conteo combinatorio (variaciones, permutaciones, combinaciones)',
    academicLevels: [{ level: 'Bachillerato', difficultyRange: { min: 1600, max: 1800 } }],
    prerequisites: ['est.probabilidad-basica'],
  },

  // Calculo (calc)
  {
    code: 'calc.limites',
    area: 'calc',
    label: 'Limites',
    description: 'Limites mentales/intuitivos de funciones simples',
    academicLevels: [
      { level: 'Bachillerato', difficultyRange: { min: 1650, max: 1850 } },
      { level: 'Ingenieria', difficultyRange: { min: 1750, max: 1950 } },
    ],
    prerequisites: ['arit.estimacion'],
  },
  {
    code: 'calc.derivadas',
    area: 'calc',
    label: 'Derivadas',
    description: 'Derivadas de funciones simples',
    academicLevels: [
      { level: 'Bachillerato', difficultyRange: { min: 1700, max: 1900 } },
      { level: 'Ingenieria', difficultyRange: { min: 1800, max: 2000 } },
    ],
    prerequisites: ['calc.limites'],
  },
  {
    code: 'calc.integrales',
    area: 'calc',
    label: 'Integrales',
    description: 'Integrales de funciones simples',
    academicLevels: [{ level: 'Ingenieria', difficultyRange: { min: 1950, max: 2150 } }],
    prerequisites: ['calc.derivadas'],
  },
  {
    code: 'calc.estimacion-numerica',
    area: 'calc',
    label: 'Estimacion numerica rapida',
    description: 'Estimacion numerica rapida aplicada',
    academicLevels: [{ level: 'Ingenieria', difficultyRange: { min: 1850, max: 2050 } }],
    prerequisites: ['arit.estimacion'],
  },
]
