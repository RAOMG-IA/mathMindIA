# US-008: Consolidar Base de Conocimiento (RAG) para Generación de Ejercicios y Pistas

**Como** administrador del sistema con acceso al servidor donde corre `ai-engine`
**Quiero** depositar ficheros con bancos de problemas, notas didácticas y pistas de referencia en un directorio local configurado
**Para** que `ai-engine` los consolide en una base de conocimiento (RAG) sobre la que apoyarse al generar ejercicios y pistas, en vez de partir únicamente del conocimiento general del modelo

## Contexto de dominio

Extiende la "Estrategia IA" de [ARCHITECTURE.md](../../ARCHITECTURE.md) ("Generar ejercicios", "Generar pistas", "Crear contenido nuevo") con una fuente de contexto adicional para `ai-engine` (UC-001 Generate Exercise Batch, UC-003 Generate Hint), hoy generados solo a partir del prompt y el `Tema`/`AcademicLevel` ([ADR-006](../ADR/ADR-006_math_topics.md)), sin ningún corpus de referencia propio.

No es una funcionalidad expuesta a los usuarios de la aplicación ni depende de `User` ([ADR-004](../ADR/ADR-004_domain.md)): el acceso es directo al sistema de ficheros del servidor, no a través de la API ni de una sesión autenticada (US-001/US-002). Precisamente por eso, quien deposita ficheros ya necesita acceso al servidor — es implícitamente administrador del sistema, sin que haga falta modelar un rol nuevo en el dominio de la aplicación.

El flujo tiene tres partes observables desde el punto de vista de producto: (1) un directorio de entrada configurado donde se depositan los ficheros, (2) un directorio de histórico configurado al que se mueven una vez procesados, (3) un registro de fecha y estado de procesado por fichero.

## Criterios de Aceptación

```gherkin
Scenario: Fichero nuevo consolidado correctamente
  Given un fichero válido depositado en el directorio de entrada configurado
  When ai-engine procesa el directorio de entrada
  Then el contenido del fichero queda consolidado en la base de conocimiento (RAG)
  And el fichero se mueve al directorio de histórico configurado
  And se registra la fecha de procesado y el estado "procesado" para ese fichero

Scenario: Fichero con error durante el procesado
  Given un fichero en el directorio de entrada con un formato no soportado o corrupto
  When ai-engine intenta procesarlo
  Then el fichero no se consolida en la base de conocimiento
  And se registra la fecha y el estado "error" para ese fichero
  And el fichero no bloquea el procesado del resto de ficheros del directorio de entrada

Scenario: Ejercicios generados a partir de un Tema con material ya consolidado
  Given un Tema con al menos un fichero de banco de problemas ya consolidado en la base de conocimiento
  When el sistema genera un nuevo ejercicio para ese Tema (UC-001)
  Then el ejercicio generado es coherente con el estilo y el contenido del material consolidado

Scenario: Pistas generadas a partir de un Tema con notas ya consolidadas
  Given un Tema con al menos un fichero de notas o pistas de referencia ya consolidado en la base de conocimiento
  When un usuario solicita una pista para un ejercicio de ese Tema (UC-003)
  Then la pista generada se apoya en el contenido de ese material en vez de solo en conocimiento genérico del modelo

Scenario: Tema sin material consolidado sigue funcionando
  Given un Tema sin ningún fichero consolidado todavía
  When el sistema genera un ejercicio o una pista para ese Tema
  Then el sistema genera contenido igual que hoy, sin RAG, sin fallar
```

## Fuera de alcance

- Cómo se asocia cada fichero a un `Tema`/`AcademicLevel` (convención de nombres, subcarpetas, o inferido del propio contenido) — decisión de Architecture, no de esta historia.
- Ubicación de los directorios de entrada/histórico: ya decidido que se configuran por variables de entorno (`.env`), para poder definirse de forma distinta por entorno — falta formalizar el nombre exacto de las variables cuando Architecture defina el Caso de Uso.
- Mecanismo de detección de ficheros nuevos: ya decidido que es un script (responsabilidad de DevOps Agent) que revisa el directorio de entrada y, si encuentra ficheros, inicia su procesado. Una iteración posterior podrá programar ese script mediante cron con un intervalo también configurable por `.env` si es posible — pendiente de formalizar junto con el resto del Caso de Uso.
- Dónde y cómo se persisten fecha y estado por fichero — no existe hoy ninguna entidad de dominio para ello ([ADR-004](../ADR/ADR-004_domain.md) no define nada equivalente a "documento RAG"); hueco explícito para Architecture al definir el Caso de Uso correspondiente.
- Reintento de ficheros en estado "error" — se define al implementar.
- Formatos de fichero soportados y tamaño máximo — se definen al implementar.
- Tecnología de almacenamiento/indexado vectorial (embeddings, base vectorial) — decisión técnica, se toma "en el momento de implementar" (mismo criterio que Zod/Expo Router, [ADR-001](../ADR-001_LenguajesMetodologias.md)).
- Cómo se pondera el material consolidado frente al conocimiento general del modelo al generar — responsabilidad del `ai-engine`, fuera del alcance de una historia de producto.
- **Control de acceso al directorio de entrada**: es responsabilidad de la infraestructura del servidor, no de la autenticación/autorización de la aplicación — mismo criterio que la gestión de secretos en [ADR-012](../ADR/ADR-012_linea_base_seguridad.md) (viven en variables de entorno del servidor, no en la aplicación).
- **Riesgo de seguridad a evaluar por Security Agent**: el contenido de un fichero depositado entra en el contexto que se envía a Qwen — mismo mecanismo de prompt injection ya señalado en [ADR-012](../ADR/ADR-012_linea_base_seguridad.md) para UC-001/UC-003, que hoy solo contempla el prompt del usuario como vector de entrada. Esta historia añade una tercera vía de contenido no confiable hacia el prompt, todavía no cubierta por esa línea base.
