import type { Clock } from '@mathmind/shared-domain'

// Fake deterministico de Clock -- ver packages/shared-domain/src/ports/Clock.ts.
export class FixedClock implements Clock {
  constructor(private readonly fixedDate: Date) {}

  now(): Date {
    return this.fixedDate
  }
}
