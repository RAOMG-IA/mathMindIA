// Puerto minimo para obtener la hora actual. Permite a los Casos de Uso sellar
// timestamps sin acoplarse a `new Date()`; en tests se inyecta un fake deterministico
// (ver packages/shared-testing/src/mocks).
export interface Clock {
  now(): Date
}
