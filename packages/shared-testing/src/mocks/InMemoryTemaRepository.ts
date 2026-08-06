import type { Tema, TemaCode, TemaRepository } from '@mathmind/shared-domain'

// Doble de test en memoria de TemaRepository -- ver packages/shared-domain/src/repositories/TemaRepository.ts.
// Sin `save`: el catalogo real se puebla por seed/migracion, no por la Application layer -- se
// precarga en el constructor.
export class InMemoryTemaRepository implements TemaRepository {
  private readonly temas: Map<TemaCode, Tema>

  constructor(seed: readonly Tema[] = []) {
    this.temas = new Map(seed.map((tema) => [tema.code, tema]))
  }

  async findByCode(code: TemaCode): Promise<Tema | null> {
    return this.temas.get(code) ?? null
  }
}
