# ADR-001: Stack Tecnológico y Metodologías

## Estado

Aceptado

## Contexto

El stack tecnológico de MathMind AI solo estaba documentado como una lista informativa en [README.md](../README.md), sin registrarse como una decisión arquitectónica formal pese a que [ARCHITECTURE.md](../ARCHITECTURE.md) exige documentar mediante ADR toda decisión arquitectónica significativa (regla 10 de "Reglas para Agentes IA"). Este ADR lo formaliza, junto con las metodologías de desarrollo adoptadas para el proyecto.

## Decisión

### Stack Tecnológico

#### Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- Zustand
- TanStack Query

#### Backend

- Node.js
- Express
- TypeScript

#### Motor IA

- LangChain
- TypeScript
- Modelo Qwen
- Zod (validación en tiempo de ejecución de los contratos de entrada/salida de Qwen — ver "Adenda" más abajo)

#### Persistencia

- PostgreSQL
- Redis

#### Calidad

- Vitest
- Playwright
- ESLint
- Prettier

#### DevOps

- Docker
- Docker Compose
- GitHub Actions

Racional resumido: TypeScript de punta a punta (frontend, backend, AI engine) para tipado compartido vía `shared-types`; React Native + Expo por portabilidad mobile sin duplicar base de código; Expo Router para navegación — construido sobre React Navigation, default actual de Expo, y su enrutado por archivos mapea de forma natural con las pantallas ya listadas en las [User Stories](user-stories/); Qwen como modelo de IA generativa (no participa en el flujo crítico, ver [ARCHITECTURE.md](../ARCHITECTURE.md) "Estrategia IA"); PostgreSQL como almacenamiento durable y Redis como caché de baja latencia para el Exercise Pool.

### Metodologías

#### TDD

```text
Red
 ↓
Green
 ↓
Refactor
```

Todo desarrollo comienza mediante pruebas automatizadas (ver también la TDD Enforcement Rule en [ADR-003](ADR-003_Trazabilidad.md)).

#### SDD

```text
Diseño
 ↓
Casos de Uso
 ↓
Tests
 ↓
Implementación
```

Las decisiones arquitectónicas preceden a la implementación: ADRs, diagramas, casos de uso y contratos se cierran antes de escribir código productivo.

### Adenda (2026-08-06): Zod para validación de contratos IA

Al implementar `QwenClient` (`apps/ai-engine/src/llm`) se decide **Zod** como librería de validación en tiempo de ejecución de `GenerateExerciseOutput`/`GenerateHintOutput` — nombrada como candidato en 4 sitios del código (`QwenClient.ts`, `prompts/GenerateExercise.ts`, `prompts/GenerateHint.ts`, `prompts/README.md`) desde que se definieron esos contratos, pero nunca ratificada, mismo criterio ya aplicado a la decisión de Expo Router (stack elegido en el momento de implementar, no de antemano). Necesaria porque un `interface` de TypeScript se borra en compilación y no sirve para validar la respuesta real de Qwen antes de usarla con `.withStructuredOutput()` de LangChain. Validación de **forma** únicamente (no de invariantes de dominio, que siguen siendo responsabilidad del Caso de Uso que consuma el resultado).

## Consecuencias

- El stack queda citable y justificado para la memoria del TFM, no solo listado.
- README.md conserva su propia sección de Stack Tecnológico para visitantes del repositorio; este ADR es la fuente canónica si hay discrepancia entre ambos.
- Cambiar cualquier pieza del stack (p. ej. sustituir Qwen por otro modelo) requiere un nuevo ADR que referencie y supere a este.
