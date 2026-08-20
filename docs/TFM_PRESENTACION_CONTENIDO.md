# MathMind AI — Contenido detallado de la presentación de TFM

**Documento de apoyo para `docs/TFM_Presentacion.pptx`** (17 diapositivas, defensa corta ≈12-15 min). Incluye 5 capturas de pantalla reales (login, sesión con un ejercicio real generado por IA, home, resumen de sesión y estadísticas), tomadas contra el backend real en local — no mockups.
Cada apartado `##` se corresponde 1:1 con una diapositiva del `.pptx`. Para cada una: **qué va en la diapositiva** (texto real, tal cual aparece) y **notas del orador** (lo que se dice en voz alta, no escrito en la slide). Fuente de todo el contenido: el propio repositorio (ADRs, `docs/STATUS.md`, `docs/metrics/trazabilidad.md`, `docs/TFM_PRESENTACION_GOBERNANZA.md`, historial de commits) — verificado contra el código real, no solo contra la documentación, el 2026-08-19/20.

---

## Slide 1 — Título

**En la diapositiva:**
- MathMind AI
- Aprendizaje adaptativo de cálculo mental, construido por un sistema multiagente de IA
- TFM · Máster en Desarrollo de Software Potenciado con IA
- Rubén Abad

**Notas del orador:** Presentación en dos capas, como el propio TFM: el producto (una app real, funcional, con 4 niveles académicos) y el proceso (cómo se construyó, con agentes de IA especializados gobernados por reglas explícitas y medidos con datos, no solo descritos).

---

## Slide 2 — Objetivo del TFM

**En la diapositiva:**
- Objetivo doble:
  1. Construir un producto real y completo — no un prototipo
  2. Gobernar **y medir** un desarrollo con agentes de IA especializados por rol
- "No solo describir la gobernanza — medir su cumplimiento real"

**Notas del orador:** El objeto de estudio no es solo la app. Es demostrar que un desarrollo con agentes de IA puede seguir Clean Architecture, TDD y decisiones arquitectónicas formales (ADRs) de forma verificable — y, más importante, documentar honestamente dónde ese proceso falló y qué mecanismo se introdujo para corregirlo. Esa segunda parte es el aporte académico más defendible, y se detalla en los bloques 12-16.

---

## Slide 3 — El producto en una frase

**En la diapositiva:**
- **MathMind AI**: plataforma de entrenamiento de cálculo mental adaptativo
- 4 niveles: Primaria · Secundaria · Bachillerato · Ingeniería
- 2 modos: **Test** (opción múltiple, sin pistas) · **Resolución** (respuesta libre, pistas progresivas)
- La dificultad se adapta al usuario en tiempo real, no es fija

**Captura real:** pantalla de Login (`apps/mobile-app`, build web), a la derecha de los bullets.

**Notas del orador:** README.md lo resume así. La distinción Test/Resolución no es solo de UI — cambia el contrato de datos (`Exercise.options` solo existe en Test) y el sistema de pistas (solo aplica en Resolución). Esa regla de negocio está modelada como invariante de dominio, no como un `if` disperso en el código.

---

## Slide 4 — Experiencia de usuario

**En la diapositiva (flujo):**
Registro / Login → Home (elegir Tema + Nivel) → Sesión (resolver, pedir pista, finalizar) → Resumen → Estadísticas

- 7 User Stories (US-001 a US-007) — **todas implementadas**, MVP funcional completo
- 23 Temas del catálogo matemático (ADR-006), agrupados en 2 niveles: Área → Tema

**Captura real:** pantalla de Sesión en Modo Test, con un ejercicio real generado por IA (`3x - 7 = 2x + 5`, con nota de cálculo mental y las 3 opciones), a la derecha de los bullets.

**Notas del orador:** Cada flecha del diagrama es una pantalla real de `apps/mobile-app` (Expo Router — Android, iOS y Web desde una única base de código). El catálogo de 23 Temas no es una lista estática: vive en base de datos (`GET /temas`), sembrado desde ADR-006. US-008 (subir material de referencia para el RAG) es la única historia que queda fuera del uso del estudiante — es una herramienta de administrador de contenido, no parte de la experiencia MVP.

---

## Slide 5 — Tour por la app real

**En la diapositiva (3 capturas reales, sin texto adicional):**
- Home — elegir modo, nivel y tema
- Resumen de sesión (aciertos, tiempo medio de respuesta, variación de rating)
- Estadísticas por tema (desglose con etiquetas "Fuerte"/"A mejorar")

**Notas del orador:** Tres capturas reales, seguidas de principio a fin contra el mismo backend real en local: elegir Tema y Nivel en Home, terminar la sesión y ver el Resumen, y el desglose acumulado en Estadísticas. Nada de esto es mockup — es el build web real (`expo export --platform web`) contra `backend-api` real, con un usuario y una sesión creados de verdad vía API para esta captura. Slide deliberadamente sin bullets — que hablen las capturas.

---

## Slide 6 — Motor de dificultad adaptativa

**En la diapositiva:**
- ADR-005: rating continuo tipo **Elo**, no niveles fijos tipo "fácil/media/difícil"
- Cada usuario tiene un rating **por nivel académico explorado** (`Map<AcademicLevel, Difficulty>`)
- El siguiente ejercicio se elige dentro de una banda alrededor del rating actual (UC-008)
- Semilla inicial por nivel: Primaria 800 · Secundaria 1200 · Bachillerato 1600 · Ingeniería 2000

**Notas del orador:** `AdaptiveDifficultyEngine` fue el primer componente de dominio construido con TDD real (Red→Green desde el primer commit). Es puro — sin dependencias de framework — y demostrable con 8/8 tests en verde. Aquí también entra el bug real #27 (bloque de errores, slide 16): la semilla inicial ignoraba el nivel académico durante varias iteraciones porque todos los tests usaban Secundaria por defecto, enmascarando el fallo — buen ejemplo de cómo un test "verde" no siempre significa "correcto".

---

## Slide 7 — Generación de contenido con IA: estrategia

**En la diapositiva:**
- La IA **no interviene en cada petición del usuario final**
- Ejercicios generados en **lotes batch** previos, almacenados en base de datos (UC-001)
- La IA se reserva para: generación masiva de contenido + pistas bajo demanda (UC-003)
- Motivo: coste, latencia y escalabilidad — no solo conveniencia técnica

**Notas del orador:** Esta es una decisión de arquitectura, no un detalle de implementación — está en el README como "Estrategia de Inteligencia Artificial". El "Pool de Ejercicios" (`ExerciseRepository.findByDifficultyBand`) es la pieza que hace posible esto: seleccionar el siguiente ejercicio es determinista y rápido, sin llamar al LLM en el camino feliz. Solo si el pool se agota de verdad, hay un flujo de última instancia (UC-008 flujo 2b) que genera bajo demanda — la única excepción documentada.

---

## Slide 8 — RAG: contenido de referencia

**En la diapositiva:**
- ADR-014: un administrador deposita material de referencia (texto/Markdown) → se indexa
- **pgvector** (no Chroma) — mismo PostgreSQL, sin servicio nuevo que levantar
- Embeddings **locales** (`Xenova/all-MiniLM-L6-v2`, 384 dim) — sin coste ni dependencia de red
- El contexto recuperado enriquece los prompts de UC-001/UC-003, opcional y sin bloquear el camino feliz

**Notas del orador:** La decisión de pgvector sobre Chroma se tomó comparando explícitamente ambas: el cliente JS de LangChain para Chroma exige un servidor HTTP aparte, sin modo embebido en Node — justo el tipo de pieza adicional que ya se había descartado al mantener el proyecto mono-servidor. Con pgvector, embeddings y registro de ingesta viven en la misma base, misma herramienta de backup (`pg_dump`). Riesgo aceptado y documentado: el contenido ingerido es una tercera fuente de prompt injection no mitigada aún, señalada explícitamente a Security.

---

## Slide 9 — Arquitectura técnica

**En la diapositiva:**
- **Clean Architecture** — dominio agnóstico de framework (sin Express, sin Prisma, sin React)
- Monorepo: `apps/{backend-api, ai-engine, mobile-app}` + `packages/shared-{domain,types,utils,testing,config,constants}`
- Stack: TypeScript de punta a punta · Express · Prisma + PostgreSQL (+ pgvector) · React Native/Expo
- Una sola base de código mobile → Android, iOS y Web

**Notas del orador:** La regla de reutilización obligatoria (`.ai/AGENTS.md`) prohíbe duplicar entidades, DTOs o utilidades entre apps — todo lo compartido vive en `packages/shared-*`, verificable antes de crear cualquier artefacto nuevo. La elección de Prisma se ratificó explícitamente en ADR-013 (antes solo aparecía mencionada, no decidida). El backend expone una API REST documentada (`openapi.yaml`), y el mobile-app la consume vía TanStack Query.

---

## Slide 10 — Modelo de dominio

**En la diapositiva:**
- Entidades: `User` · `Exercise` · `Session` · `Answer` · `Hint`
- Value Objects: `Difficulty` · `Score` · `Timer` · `AcademicLevel` · `ExerciseType`
- `ExercisePool` **no es una entidad** — es una vista derivada (`ExerciseRepository.findByDifficultyBand`)
- Invariantes reales aplicadas: p. ej. todo `Answer` de una `Session` respeta el `type` del `Exercise`

**Notas del orador:** ADR-004 formaliza lo que estaba disperso. La decisión de no modelar `ExercisePool` como entidad evita duplicar el mismo dato (`difficulty`) en dos sitios sincronizados — es una vista filtrada, no un estado propio. La invariante de `type` coincidente parece obvia sobre el papel, pero **no se aplicaba en el código real** hasta el incidente #62 (ver slide 16) — un ejemplo directo de la brecha entre "documentado" y "implementado" que también aparece en la parte de gobernanza.

---

## Slide 11 — Seguridad y despliegue

**En la diapositiva:**
- ADR-012 (línea base de seguridad, proporcional al estado real del proyecto):
  contraseñas con bcrypt · secretos solo en variables de entorno · datos mínimos de menores · roles system/user + validación Zod de la salida del LLM
- CI/CD real: GitHub Actions — `quality` (typecheck/lint/test) → `e2e` (Playwright, backend+Postgres reales) → `deploy`
- Despliegue continuo a AWS (EC2 free tier, IaC con CloudFormation, autenticación OIDC sin claves de larga duración)

**Notas del orador:** La primera versión de la seguridad del proyecto era un paquete de 5 ADRs pensado para Vault/RBAC/Zero Trust — sobredimensionado para un TFM sin esa infraestructura. Se sustituyó por un ADR-012 único, proporcional al riesgo real (prompt injection en los 2 puntos donde el sistema habla con el LLM; datos de menores por `AcademicLevel.Primaria`). El pipeline de CI/CD es real y se ejecuta en cada push — incluida una corrección muy reciente (19-20 de agosto) de un desajuste en el trust policy de OIDC, buen ejemplo de iteración real sobre infraestructura real, no solo sobre código de aplicación.

---

## Slide 12 — Gobernanza: sistema multiagente

**En la diapositiva:**
- Jerarquía estratégica: Usuario → Director → Orchestrator → Knowledge Manager → Agentes operativos
- Flujo operativo **obligatorio**: Product → Architecture → Test → Developer → Reviewer → Security → Documentation
- "Ninguna fase puede omitirse" — `.ai/AGENTS.md`
- Regla de oro: ningún agente toca código sin consultar antes ADRs/ARCHITECTURE.md/README.md

**Notas del orador:** Aquí empieza el segundo objeto de estudio del TFM. 8 agentes operativos con responsabilidades y restricciones explícitas — p. ej. Test **no puede** implementar código productivo, Developer **no puede** crear código sin tests previos. El QA Agent se eliminó deliberadamente (ADR-002): sus funciones se repartieron entre Product/Test/Reviewer/Security para no duplicar responsabilidades de calidad ya cubiertas. Esta diapositiva es la promesa de diseño — las siguientes 3 muestran qué pasó cuando se contrastó contra la realidad.

---

## Slide 13 — El incidente que cambió el proceso

**En la diapositiva:**
> "Verificado en la práctica que la jerarquía de decisión y el flujo obligatorio no se estaban siguiendo: ninguna tarea pasó realmente por Director/Orchestrator/Knowledge Manager, y Reviewer/Security se saltaron en la implementación de autenticación real."
> — Adenda a ADR-002, 2026-08-07

- **Mecanismo introducido**: Contrato de Handoff — 8 campos obligatorios antes de ejecutar cualquier tarea no trivial (`requester`, `objective`, `scope`, `constraints`, `references`, `acceptance`, `risks`, `required_agents`)
- Omitir un agente exige justificación explícita, nunca un silencio que se descubre después

**Notas del orador:** Esta es la slide de impacto argumental número 1. El fallo no fue de diseño — el flujo estaba bien pensado. El fallo fue que **no existía ningún punto de control mecánico** que impidiera saltárselo. La lección explícita del proyecto, repetida en las conclusiones: la solución no fue "tener más cuidado", fue cambiar el proceso para que saltarse un paso sea visible y bloqueante.

---

## Slide 14 — De la prosa al dato medible

**En la diapositiva:**
- ADR-003 (origen): registro en prosa libre por agente — "la disciplina de registro es manual, no forzada por tooling"
- ADR-017 (evolución, 2026-08-10): front-matter YAML machine-readable sobre cada entrada (`task_id`, `flujo`, `agentes`, `estado`...)
- Migración **retroactiva completa**: 86/86 entradas migradas, 49 tareas distintas
- `npm run metrics -- --report` calcula los KPIs automáticamente

**Notas del orador:** El propio ADR-017 lo explica: las skills del sistema (`​.ai/skills/*.md`) siempre definieron secciones "KPIs" — pero ninguna se medía, porque la trazabilidad era prosa libre no consultable. Este es el paso de gobernanza **descrita** a gobernanza **instrumentada**. La migración fue retroactiva a propósito, sobre toda la historia del proyecto, para tener un baseline de KPIs desde el día 1 y no solo desde que se introdujo la herramienta.

---

## Slide 15 — Resultados medidos (KPIs reales)

**En la diapositiva (tabla):**

| KPI | Valor medido |
|---|---|
| % tareas con handoff estructurado | 8,2% (4/49) |
| % tareas con Reviewer en el flujo | 4,1% (2/49) |
| % tareas con Security en el flujo | 16,3% (8/49) |
| Adherencia al flujo completo (7 fases) | **0,0%** (0/49) |
| Cumplimiento de Reviewer cuando el flujo lo exigía | 50,0% (1/2) |

*`docs/metrics/trazabilidad.md`, generado 2026-08-11 sobre 86 entradas / 49 tareas*

**Notas del orador:** Esta es la slide central de la defensa. Incluso **después** de introducir el Contrato de Handoff, el flujo obligatorio de 7 fases no se cumplió completo en ninguna tarea real del proyecto. Reviewer sigue siendo el eslabón más débil. La lectura honesta, y la que hay que defender: esto no es un fracaso del sistema — es la prueba de que medir en vez de solo describir permite saber esto con certeza, en vez de descubrirlo por accidente (como pasó con el incidente de la slide 13).

---

## Slide 16 — Errores reales (selección)

**En la diapositiva (4 casos):**
1. **IDOR en mensajes de error** — 3 rutas protegidas distinguían "sesión inexistente" de "sesión de otro usuario" → mensaje genérico + 403 (`errorMapping.ts`)
2. **"Siguiente ejercicio" repetía siempre el mismo** — 2 causas raíz independientes: dificultad no repartida en lotes + falta de filtro por `type` (invariante documentada, nunca aplicada)
3. **LLM devolvía `number` donde el contrato pedía `string`** — Zod rechazaba lotes completos → coacción explícita en el borde (`stringifiableValue`)
4. **Trust policy de AWS OIDC condicionaba por `ref`, el job usa `environment`** — `AssumeRoleWithWebIdentity` fallaba siempre, no de forma intermitente (corregido 2026-08-19)

**Notas del orador:** Cuatro categorías distintas a propósito: seguridad, lógica de negocio, integración con IA generativa e infraestructura real de nube. El patrón común, señalado en las conclusiones del documento de gobernanza: los huecos de diseño se revelan al construir el siguiente consumidor real, no en la fase de diseño — y varios de estos incidentes (el de OIDC es el más reciente, de esta misma semana) se diagnosticaron verificando primero con herramientas externas (`curl`, la propia API de GitHub Actions) antes de tocar código, para no corregir la causa equivocada.

---

## Slide 17 — Conclusiones

**En la diapositiva:**
- Producto: **MVP funcional completo** — 7/7 User Stories, 18/18 ADR en estado Aceptado
- Un sistema multiagente gobernado por reglas explícitas **no garantiza por sí solo** su cumplimiento
- La gobernanza solo es verificable cuando pasa de estar **descrita** a estar **instrumentada**
- Trabajo futuro: cobertura real de tests (no solo declarada), cerrar la brecha de Reviewer, HTTPS en producción, build nativo (EAS) integrado en CI/CD

**Notas del orador:** Cierre con las dos caras del TFM a la vez: el producto se puede usar de principio a fin hoy mismo, y el proceso que lo construyó queda documentado con evidencia medible, no solo con buenas intenciones. Los errores documentados no son un fracaso — son el material de evidencia principal: cada incidente motivó un mecanismo de corrección concreto y trazable, no una anécdota. Abrir turno de preguntas.

---

## Fuentes citadas

`README.md` · `ARCHITECTURE.md` · `.ai/AGENTS.md` · ADR-000 a ADR-018 (todos en estado Aceptado) · `docs/STATUS.md` · `docs/metrics/trazabilidad.md` · `docs/TFM_PRESENTACION_GOBERNANZA.md` · `scripts/metrics/trazabilidad.ts` · historial de commits del repositorio (2026-08-06 a 2026-08-20).
