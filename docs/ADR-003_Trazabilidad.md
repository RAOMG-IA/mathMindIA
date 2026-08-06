# ADR-003: TDD Enforcement, Reutilización y Trazabilidad

## Estado

Aceptado

## Contexto

Con un sistema multiagente ([ADR-002](ADR-002_Agentes.md)) generando gran parte del código y la documentación de MathMind AI, se necesitan reglas explícitas y verificables que eviten dos riesgos: implementar sin cobertura de tests ni diseño previo, y duplicar entidades/utilidades ya existentes en `packages/shared-*`. Además, cada decisión tomada por un agente debe quedar auditable.

## Decisión

### TDD Enforcement Rule

Ningún agente puede implementar código sin:

- Historia de usuario.
- Diseño arquitectónico.
- Tests definidos.

### Regla de Reutilización

Buscar siempre antes en:

- `packages/shared-domain`
- `packages/shared-types`
- `packages/shared-utils`
- `packages/shared-testing`
- `packages/shared-config`
- `packages/shared-constants`

Prohibido duplicar:

- Entidades.
- DTOs.
- Utilidades.
- Constantes.
- Configuración.

### Regla de Trazabilidad

Todo agente debe registrar:

- Input.
- Contexto utilizado.
- Decisión tomada.
- Output generado.

En:

```text
.ai/prompts/<agent>.md
```

Ejemplos:

```text
.ai/prompts/product.md
.ai/prompts/test.md
.ai/prompts/security.md
```

## Consecuencias

- Verificable: cualquier revisor puede abrir `.ai/prompts/<agent>.md` y reconstruir por qué se tomó una decisión, sin depender de memoria de conversación.
- Coste: la disciplina de registro es manual, no forzada por tooling; requiere que cada agente/skill la cumpla activamente en cada uso (ver ejemplo de cumplimiento real en las entradas de `architecture.md` para ADR-004 y ADR-005).
- La Regla de Reutilización solo es efectiva si `packages/shared-*` existe y está poblado; hasta que se inicie esa implementación, es una regla preventiva sin superficie real que verificar.
