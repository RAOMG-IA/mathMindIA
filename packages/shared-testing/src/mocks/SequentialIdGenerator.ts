import type { IdGenerator } from '@mathmind/shared-domain'

// Fake deterministico de IdGenerator -- ver packages/shared-domain/src/ports/IdGenerator.ts.
// Genera "{prefix}-1", "{prefix}-2", ... para asserts deterministas en tests.
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0

  constructor(private readonly prefix: string) {}

  generate(): string {
    this.counter += 1
    return `${this.prefix}-${this.counter}`
  }
}
