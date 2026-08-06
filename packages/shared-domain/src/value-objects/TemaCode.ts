// Code estable de un Tema del catalogo (p.ej. "arit.fracciones").
// No es una union literal a proposito: docs/ADR/ADR-006_math_topics.md deja el catalogo
// explicitamente "representativo, no exhaustivo, se amplia con uso real" -- una union
// literal se rompería cada vez que se anadiera un Tema nuevo.
export type TemaCode = string
