// Puerto minimo para generar identificadores de entidad. Permite a los Casos de Uso
// crear IDs sin acoplarse a crypto.randomUUID() ni a la infraestructura concreta;
// en tests se inyecta un fake deterministico (ver packages/shared-testing/src/mocks).
export interface IdGenerator {
  generate(): string
}
