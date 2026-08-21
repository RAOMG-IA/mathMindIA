# Product Agent
Generate user stories, acceptance criteria, backlog and roadmap.

---

---
task_id: STATUS-004
date: 2026-08-05
agentes: [product]
flujo: [product]
artefactos: [docs/user-stories/]
estado: done
---

## 2026-08-05 — User Stories US-001 a US-007

**Input**: Organizar las User Stories candidatas de STATUS.md (pendiente #4) en `docs/user-stories/*`, un archivo por historia.

**Contexto utilizado**: STATUS.md (lista candidata US-001 a US-007), ADR-004 (entidades User/Session/Exercise/Answer/Hint), ADR-005 (rating y racha), ADR-006 (taxonomía de temas), README.md (Modo Test/Resolución), .ai/skills/product.md (formato Como/Quiero/Para + INVEST, restricción de no diseñar arquitectura).

**Decisión tomada**: 7 historias con criterios de aceptación en Gherkin. Se distinguió explícitamente US-002 (Login, autenticación) de US-003 (Iniciar Sesión de Entrenamiento, arranque de `Session` de práctica) por posible confusión de nombres. Se detectó que US-007 (Ver Estadísticas) no tiene caso de uso asignado entre UC-001 y UC-006 — queda como nota para cuando se definan Casos de Uso.

**Output generado**: [docs/user-stories/](../../docs/user-stories/) (README índice + US-001 a US-007).

---

---
task_id: STATUS-030
date: 2026-08-07
handoff_ref: STATUS-030
agentes: [product]
flujo: [orchestrator, knowledge, product]
artefactos: [docs/user-stories/US-008-subir-material-rag.md, docs/user-stories/README.md]
estado: done
---

## 2026-08-07 — US-008: Consolidar Base de Conocimiento (RAG)

**Input**: el usuario pidió una historia de usuario para `ai-engine` que permita subir ficheros al LLM para consolidar RAG y especificar una base de problemas, notas y pistas. Despachada vía handoff (`.ai/prompts/orchestrator.md`, segundo handoff real).

**Contexto utilizado**: `ARCHITECTURE.md` ("Estrategia IA": generar ejercicios/pistas/contenido ya permitido, sin fuente de referencia propia hoy), UC-001/UC-003 (únicos puntos que construyen prompts hacia Qwen), ADR-006 (Tema/AcademicLevel como forma natural de asociar material subido), ADR-004 (dominio actual: `User` sin campo de rol, ningún actor de gestión de contenido existe), ADR-012 (riesgo de prompt injection ya señalado para UC-001/UC-003, sin cubrir todavía una tercera vía de entrada).

**Decisión tomada**: actor nuevo "gestor de contenido", explícitamente señalado como no modelado en el dominio (mismo tratamiento que US-007 con su Caso de Uso pendiente, no se inventa un sistema de roles para resolverlo aquí). 5 escenarios Gherkin: subida válida, fichero no soportado, ejercicio generado con material propio, pista generada con notas propias, Tema sin material sigue funcionando sin RAG (evita que la historia implique una ruptura si no hay contenido subido). "Fuera de alcance" señala explícitamente a Architecture (rol/UC), a la tecnología de indexado (se decide al implementar, mismo criterio que Zod/Expo Router) y a Security (nueva vía de contenido no confiable hacia el prompt).

**Output generado**: `docs/user-stories/US-008-subir-material-rag.md`, `docs/user-stories/README.md` (índice + nota de trazabilidad).

---

---
task_id: STATUS-030
date: 2026-08-07
handoff_ref: STATUS-030
agentes: [product]
flujo: [orchestrator, knowledge, product]
artefactos: [docs/user-stories/US-008-subir-material-rag.md]
estado: done
---

## 2026-08-07 — US-008: redefinición del actor y del flujo (directorio local, sin API de subida)

**Input**: el usuario corrigió la primera versión — `ai-engine` no depende de ningún usuario de la aplicación; la subida es un directorio local configurado donde se depositan ficheros, que se mueven a un directorio de histórico tras procesarse, registrando fecha y estado en base de datos. Al ser acceso local al servidor, quien deposita ficheros ya es de facto administrador del sistema.

**Contexto utilizado**: la versión anterior de la historia (actor "gestor de contenido" vía subida HTTP, ahora descartada), US-001/US-002 (autenticación de aplicación, que este flujo explícitamente no usa), ADR-012 (gestión de secretos como precedente de "vive en el servidor, no en la aplicación", mismo criterio aplicado aquí al control de acceso del directorio).

**Decisión tomada**: actor pasa de "gestor de contenido" (rol de aplicación, sin modelar) a "administrador del sistema" (acceso de infraestructura, fuera de la autenticación de la aplicación) — resuelve el hueco de rol sin necesidad de modelarlo en `User`, porque ya no es una acción de la aplicación. 3 elementos observables desde producto añadidos a los criterios de aceptación: directorio de entrada, directorio de histórico (fichero se mueve tras procesar), registro de fecha+estado por fichero. Nuevo escenario de error (fichero no procesable) que no bloquea el resto del directorio. Se mantiene fuera de alcance cómo se configuran los directorios, cómo se detectan ficheros nuevos, y dónde se persiste fecha/estado (ninguna entidad equivalente en ADR-004) — todo eso es Architecture, no Product.

**Output generado**: `docs/user-stories/US-008-subir-material-rag.md` (reescrita), `docs/user-stories/README.md` (actor y nota actualizados).

---

---
task_id: STATUS-030
date: 2026-08-07
handoff_ref: STATUS-030
agentes: [product]
flujo: [orchestrator, knowledge, product]
artefactos: [docs/user-stories/US-008-subir-material-rag.md]
estado: done
---

## 2026-08-07 — US-008: configuración por .env, script de DevOps y cron — registradas en "Fuera de alcance", no en el cuerpo de la historia

**Input**: el usuario pidió añadir que los directorios se configuran por `.env` (por entorno), que DevOps generará un script que revisa el directorio y dispara el procesado si hay ficheros nuevos, y que más adelante se podrá programar por cron con intervalo también configurable por `.env`.

**Contexto utilizado**: `docs/user-stories/README.md` ("no incluyen diseño técnico ni de arquitectura"), `.ai/skills/product.md` (restricción "No crear arquitectura"), el propio US-008 ("Fuera de alcance" ya listaba estos dos puntos como decisión pendiente de Architecture antes de esta entrada — mismo desajuste que motivó el enrutamiento a Architecture Agent para la API REST (`STATUS.md` #25).

**Decisión tomada** (confirmada vía AskUserQuestion): no se añade a Como/Quiero/Para ni al Gherkin. Se reescriben las dos líneas correspondientes de "Fuera de alcance" para reflejar que la decisión ya está tomada por el usuario (`.env` por entorno, script de DevOps, cron opcional con intervalo también por `.env`) — pero la formalización (nombres de variables, Caso de Uso) se deja para cuando Architecture Agent lo defina. Mantiene la historia como producto puro sin perder el detalle aportado.

**Output generado**: `docs/user-stories/US-008-subir-material-rag.md` ("Fuera de alcance" actualizado).

---

---
task_id: STATUS-064
date: 2026-08-21
handoff_ref: STATUS-064
agentes: [product]
flujo: [director, product]
artefactos: [docs/user-stories/US-010-cerrar-sesion.md]
estado: done
---

## 2026-08-21 — US-010: Cerrar sesión (logout manual + automático por inactividad)

**Input**: el usuario (Project Director) pidió una historia de usuario para poder cerrar sesión, tanto por botón explícito como por inactividad, con redirección a la pantalla de login en ambos casos.

**Contexto utilizado**: `docs/user-stories/US-002-login.md` (contraparte de apertura de sesión, mismo cuidado de nomenclatura "sesión autenticada" vs. otro concepto del dominio), `docs/user-stories/US-006-finalizar-sesion.md` (el otro "cerrar/finalizar" ya existente en el proyecto, que es una `Session` de entrenamiento — no autenticación; riesgo real de confusión de nombres, igual que ya advertía US-002 sobre US-003). Verificado antes de escribir la historia que `useSessionStore.logout(storage)` ya existe en el código (`apps/mobile-app/src/store/useSessionStore.ts`) pero ningún componente lo invoca todavía — no hay botón de logout en la UI actual (`AppHeader.tsx` solo tiene navegación a Inicio/Estadísticas); y que `expireSession()` solo reacciona a un 401 real detectado por el servidor (token inválido), un mecanismo distinto del cierre por inactividad del lado cliente que pide esta historia.

**Decisión tomada** (confirmada vía `AskUserQuestion`): timeout de inactividad fijado en 15 minutos; sí se avisa al usuario antes del cierre automático, con opción de continuar la sesión (no cierre directo sin aviso). Se deja explícitamente fuera de alcance el mecanismo concreto de detección de inactividad/temporizador y si el logout debe además revocar el token en servidor antes de su expiración natural de 7 días (`JwtTokenIssuer`) — ambas son decisiones de Architecture/Security, no de esta historia.

**Output generado**: `docs/user-stories/US-010-cerrar-sesion.md` (nueva). `docs/user-stories/README.md` (fila del índice + nota de trazabilidad US-010 vs. US-006).