# ADR-006: Taxonomía de Conocimiento Matemático

## Estado

Propuesto

## Contexto

MathMind AI necesita organizar su conocimiento matemático para:

- Clasificar ejercicios.
- Medir progreso del estudiante.
- Detectar fortalezas y debilidades.
- Permitir itinerarios adaptativos.
- Facilitar la generación de contenido mediante IA.

[STATUS.md](../STATUS.md) (pendiente #3) y [ADR-004](ADR-004_domain.md) dejaban `Exercise.topic` como `string` sin tipar, "placeholder hasta que exista `math-topics.md`". Este ADR cierra esa dependencia.

Restricción explícita del planteamiento: la taxonomía debe ser **jerárquica pero evitar escalado innecesario de categorías** — no generar un árbol profundo ni duplicar nodos por nivel académico. Además, el rango de dificultad de cada tema debe alinearse con el nivel/edad del usuario.

`AcademicLevel` (ADR-004) sigue siendo la única señal de edad del dominio; no se introduce un campo `age`/`birthDate` nuevo. El alineamiento "edad/rating" se resuelve combinando `difficultyRange` por nivel (este ADR) con `userRating` ([ADR-005](ADR-005-adaptive-difficulty-engine.md)).

Decisión de alcance de producto: dado que la app tiene temporizador (Modo Test/Resolución, [ADR-000](../ADR-000_Estructura.md)), el contenido de nivel **Ingeniería** se limita a **cálculo mental aplicado** (estimación, derivadas/integrales de funciones simples, álgebra lineal básica resoluble en segundos), no a un currículum de ingeniería completo con contenido simbólico extenso.

## Decisión

### Jerarquía: 2 niveles, Área → Tema

Se descarta un tercer nivel ("subtema") salvo necesidad demostrada por uso real. Dos niveles son suficientes para clasificar, agregar progreso y generar contenido; un árbol más profundo multiplicaría categorías sin beneficio claro en esta fase.

**Regla anti-escalado**: un Tema se reutiliza a través de varios `AcademicLevel`, con una `difficultyRange` distinta por nivel. Nunca se crean nodos duplicados por nivel (p. ej. no existen `arit.fracciones-primaria` y `arit.fracciones-secundaria` como Temas separados) — evitaría una explosión combinatoria de Tema × 4 niveles y duplicaría la misma noción de "fracciones" varias veces, violando la Regla de Reutilización ([ADR-003](../ADR-003_Trazabilidad.md)). Un Tema nuevo solo se crea cuando el contenido es conceptualmente distinto, no simplemente "más difícil".

### Escala de dificultad: se reutiliza `Difficulty` de ADR-005

`difficultyRange` de cada (Tema, AcademicLevel) es un **sub-rango dentro de la banda global** ya fijada en ADR-005 para ese nivel (semilla ± 400):

| AcademicLevel | Banda global (ADR-005) |
|---|---|
| Primaria | 400 – 1200 |
| Secundaria | 800 – 1600 |
| Bachillerato | 1200 – 2000 |
| Ingeniería | 1600 – 2400 |

No se crea una escala de dificultad nueva por tema — sería duplicar el mismo concepto que ya se reconcilió una vez entre ADR-004 y ADR-005 (`Rating` → `Difficulty`).

### Esquema de `Tema`

```typescript
interface Tema {
  readonly code: string          // estable, p. ej. "arit.fracciones" — usado por Exercise.topic
  readonly area: AreaCode        // "arit" | "alg" | "geo" | "est" | "calc"
  readonly label: string
  readonly description: string   // prompt hint para generación de contenido por IA
  readonly academicLevels: ReadonlyArray<{
    readonly level: AcademicLevel
    readonly difficultyRange: { min: number; max: number } // sub-rango de la escala Difficulty (ADR-005)
  }>
  readonly prerequisites?: ReadonlyArray<string> // codes de otros Temas, para itinerarios
}

type AreaCode = 'arit' | 'alg' | 'geo' | 'est' | 'calc'
```

`Exercise.topic` (ADR-004) pasa de `string` a `TemaCode` = `Tema['code']`.

### Catálogo inicial

Conjunto **representativo, no exhaustivo** — se amplía con uso real. Todos los `difficultyRange` son **placeholder editorial pendiente de calibrar** (mismo criterio de honestidad que las semillas de ADR-005).

#### Aritmética (`arit`)

| code | label | niveles y difficultyRange | prerequisites |
|---|---|---|---|
| `arit.suma-resta` | Suma y resta | Primaria 500–750 · Secundaria 800–900 (repaso/velocidad) | — |
| `arit.multiplicacion-division` | Multiplicación y división | Primaria 700–950 · Secundaria 850–1000 | `arit.suma-resta` |
| `arit.fracciones` | Fracciones (suma, simplificación, conversión) | Primaria 900–1150 · Secundaria 1000–1200 | `arit.multiplicacion-division` |
| `arit.decimales` | Decimales | Primaria 850–1100 · Secundaria 950–1150 | `arit.fracciones` |
| `arit.porcentajes` | Porcentajes | Secundaria 1150–1350 · Bachillerato 1250–1400 | `arit.decimales` |
| `arit.potencias-raices` | Potencias y raíces | Secundaria 1200–1400 · Bachillerato 1350–1550 | `arit.multiplicacion-division` |
| `arit.estimacion` | Estimación y orden de magnitud | Bachillerato 1500–1700 · Ingeniería 1700–1900 | `arit.potencias-raices` |

#### Álgebra (`alg`)

| code | label | niveles y difficultyRange | prerequisites |
|---|---|---|---|
| `alg.expresiones` | Expresiones algebraicas básicas | Secundaria 1150–1350 | `arit.potencias-raices` |
| `alg.ecuaciones-lineales` | Ecuaciones lineales | Secundaria 1250–1450 · Bachillerato 1350–1500 | `alg.expresiones` |
| `alg.ecuaciones-cuadraticas` | Ecuaciones cuadráticas | Bachillerato 1550–1750 | `alg.ecuaciones-lineales` |
| `alg.sistemas-ecuaciones` | Sistemas de ecuaciones | Bachillerato 1600–1800 | `alg.ecuaciones-lineales` |
| `alg.algebra-lineal-basica` | Álgebra lineal básica (determinantes 2×2/3×3, producto escalar) | Ingeniería 1900–2100 | `alg.sistemas-ecuaciones` |

#### Geometría (`geo`)

| code | label | niveles y difficultyRange | prerequisites |
|---|---|---|---|
| `geo.perimetros-areas` | Perímetros y áreas | Primaria 800–1050 · Secundaria 1000–1200 | `arit.multiplicacion-division` |
| `geo.angulos` | Ángulos | Primaria 850–1050 · Secundaria 1000–1150 | — |
| `geo.pitagoras` | Teorema de Pitágoras | Secundaria 1250–1450 | `geo.perimetros-areas` |
| `geo.trigonometria` | Trigonometría básica | Bachillerato 1500–1700 | `geo.angulos` |

#### Estadística y Probabilidad (`est`)

| code | label | niveles y difficultyRange | prerequisites |
|---|---|---|---|
| `est.medidas-centrales` | Media, mediana, moda | Secundaria 1150–1350 | `arit.decimales` |
| `est.probabilidad-basica` | Probabilidad básica | Secundaria 1250–1450 · Bachillerato 1400–1550 | `arit.fracciones` |
| `est.combinatoria` | Combinatoria | Bachillerato 1600–1800 | `est.probabilidad-basica` |

#### Cálculo (`calc`)

| code | label | niveles y difficultyRange | prerequisites |
|---|---|---|---|
| `calc.limites` | Límites (mentales/intuitivos) | Bachillerato 1650–1850 · Ingeniería 1750–1950 | `arit.estimacion` |
| `calc.derivadas` | Derivadas de funciones simples | Bachillerato 1700–1900 · Ingeniería 1800–2000 | `calc.limites` |
| `calc.integrales` | Integrales de funciones simples | Ingeniería 1950–2150 | `calc.derivadas` |
| `calc.estimacion-numerica` | Estimación numérica rápida | Ingeniería 1850–2050 | `arit.estimacion` |

### Cómo resuelve cada requisito

- **Clasificar ejercicios**: `Exercise.topic: TemaCode` referencia un `code` de este catálogo, en vez de texto libre.
- **Medir progreso / detectar fortalezas y debilidades**: `code` y `area` sirven como clave de agregación sobre `Answer` (ADR-004). El caso de uso de reporte en sí (p. ej. `GetStudentProgressReport`) queda fuera de este ADR — se deja como trabajo futuro que consume esta taxonomía. La jerarquía de 2 niveles permite agregar a nivel Área cuando falten datos suficientes a nivel Tema.
- **Itinerarios adaptativos**: el campo opcional `prerequisites` habilita secuenciar Temas (ver ejemplos en el catálogo, p. ej. `alg.ecuaciones-cuadraticas` requiere `alg.ecuaciones-lineales`). El algoritmo de itinerario en sí queda fuera de este ADR.
- **Generación de contenido IA**: `description` de cada Tema se usa como prompt hint en la generación batch con Qwen ([ARCHITECTURE.md](../../ARCHITECTURE.md) "Estrategia IA"); `difficultyRange` es el target inicial de `exerciseRating` (ADR-005) para los ejercicios generados de ese Tema.
- **Rango de dificultad alineado a edad/rating**: `difficultyRange` por (Tema, AcademicLevel) es un sub-rango de la banda global de ADR-005, ya correlacionada con el nivel/edad del usuario.

## Consecuencias

### Positivas

- Vocabulario estable y compartido entre generación de contenido IA, clasificación de ejercicios y futuro reporting de progreso.
- La jerarquía de 2 niveles evita explosión combinatoria de categorías × 4 niveles académicos.
- Reutiliza la escala `Difficulty` existente en vez de crear una noción de dificultad paralela por tema.
- `prerequisites` deja preparado el terreno para itinerarios adaptativos sin comprometerse a un algoritmo concreto todavía.

### Negativas / Riesgos

- Los `difficultyRange` son estimaciones editoriales, no calibradas con datos reales — mismo riesgo ya asumido en ADR-005 para las semillas por nivel.
- El catálogo es un conjunto inicial representativo, no exhaustivo; crecerá con el uso real. No se define un proceso formal de gobernanza para altas de nuevos Temas — se recomienda que sigan el mismo circuito Architecture Agent / ADR que este documento, para evitar que cada agente cree Temas ad-hoc y duplique categorías.
- Limitar Ingeniería a "cálculo mental aplicado" es una decisión de producto, no solo de contenido: si en el futuro se quisiera cubrir currículum de ingeniería completo, requeriría reconsiderar el formato de tiempo límite (p. ej. Modo Resolución sin timer estricto), no solo ampliar el catálogo.

## Fuera de alcance

- Caso de uso de reporte de fortalezas/debilidades.
- Algoritmo de itinerario adaptativo (secuenciación real usando `prerequisites`).
- Rating de dificultad por Tema en vez de por `AcademicLevel` global — seguía como fuera de alcance en ADR-005; esta taxonomía es el prerequisito para abordarlo, no lo resuelve.
- Calibración empírica de los `difficultyRange` propuestos.
- Proceso formal de gobernanza para altas de nuevos Temas.

## Trazabilidad

Registrado en `.ai/prompts/architecture.md`.

---

## Adenda 2026-08-10: exposición del catálogo vía API (`GET /temas`)

**Contexto**: al diseñar `(app)/home.tsx` (US-003, [ADR-015](ADR-015_mobile_app_screens.md)) se detectó que ningún endpoint permite a `mobile-app` obtener el catálogo de Temas para construir el selector — `TemaRepository` (puerto de dominio) solo exponía `findByCode`, sin forma de listar, y el seed real de `main.ts` era deliberadamente mínimo ("no es el catálogo real de ADR-006"), no el catálogo de 23 Temas fijado en este documento. Sin resolver esto, `(app)/home.tsx` no puede construirse: US-003 exige elegir un Tema real, no inventado en cliente.

**Decisión**: se añade `findAll(): Promise<readonly Tema[]>` a `TemaRepository` (sigue sin `save` — el catálogo se sigue poblando por seed, no por la Application layer, sin cambio respecto a la decisión original de este ADR). Nuevo `ListTemasUseCase` (Application) + `TemaController`/`GET /temas` (Presentation), protegido con el mismo `Bearer` que el resto de rutas autenticadas (dato de referencia, no sensible, pero se mantiene la coherencia con el resto del contrato en vez de abrir una excepción pública nueva). Sin filtrado server-side por `AcademicLevel`: devuelve el catálogo completo — cada `Tema` ya lleva su propio array `academicLevels`, así que el cliente filtra localmente sin necesitar un query param nuevo.

**Seed real**: `main.ts` sustituye el seed mínimo (1 Tema) por los 23 Temas de la sección "Catálogo inicial" de este mismo documento, transcritos tal cual (mismos `code`/`label`/`academicLevels`/`prerequisites`) — cierra la advertencia que el propio comentario de `main.ts` señalaba desde que se conectó Prisma.

**Por qué no una migración a Postgres**: `TemaRepository` sigue en memoria a propósito (ver decisión original de este ADR, "no es un agregado mutable desde la Application layer") — el catálogo es código/seed, no un dato mutable por el usuario. Esto no cambia con la adenda; solo se completa el seed que faltaba.

Registrado también en `ARCHITECTURE.md` ("API REST (Rutas)") y `apps/backend-api/openapi.yaml`.
