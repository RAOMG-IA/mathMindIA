import type { User, UserId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaUserRepository } from './PrismaUserRepository.js'

// Test de integracion real contra el Postgres de desarrollo (DATABASE_URL de .env, sin
// Docker -- ver vitest.integration.config.ts). Cada test crea sus propios ids unicos y los
// limpia en afterEach, no toca datos preexistentes.
describe('PrismaUserRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaUserRepository(prisma)
  const createdUserIds: UserId[] = []

  function trackUser(id: UserId): UserId {
    createdUserIds.push(id)
    return id
  }

  afterEach(async () => {
    await prisma.userRating.deleteMany({ where: { userId: { in: createdUserIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    createdUserIds.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  function aUser(overrides: Partial<User> = {}): User {
    const id = trackUser(crypto.randomUUID() as UserId)
    return {
      id,
      email: `user-${id}@example.com`,
      academicLevel: 'Secundaria',
      ratings: new Map([['Secundaria', { value: 1200 }]]),
      currentStreak: 0,
      score: { points: 0 },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  it('save + findById: round-trip completo incluyendo ratings por nivel', async () => {
    const user = aUser({
      ratings: new Map([
        ['Primaria', { value: 800 }],
        ['Secundaria', { value: 1250 }],
      ]),
      currentStreak: 3,
      score: { points: 40 },
    })

    await repository.save(user)
    const found = await repository.findById(user.id)

    expect(found).not.toBeNull()
    expect(found?.email).toBe(user.email)
    expect(found?.academicLevel).toBe('Secundaria')
    expect(found?.currentStreak).toBe(3)
    expect(found?.score).toEqual({ points: 40 })
    expect(found?.ratings.get('Primaria')).toEqual({ value: 800 })
    expect(found?.ratings.get('Secundaria')).toEqual({ value: 1250 })
  })

  it('findById: devuelve null si no existe', async () => {
    const found = await repository.findById('does-not-exist' as UserId)
    expect(found).toBeNull()
  })

  it('findByEmail: encuentra por email, null si no existe', async () => {
    const user = aUser()
    await repository.save(user)

    const found = await repository.findByEmail(user.email)
    expect(found?.id).toBe(user.id)

    const notFound = await repository.findByEmail('nobody@example.com')
    expect(notFound).toBeNull()
  })

  it('save: upsert -- una segunda llamada actualiza en vez de duplicar', async () => {
    const user = aUser({ ratings: new Map([['Secundaria', { value: 1200 }]]) })
    await repository.save(user)

    await repository.save({
      ...user,
      currentStreak: 5,
      ratings: new Map([
        ['Secundaria', { value: 1215 }],
        ['Primaria', { value: 800 }],
      ]),
    })

    const found = await repository.findById(user.id)
    expect(found?.currentStreak).toBe(5)
    expect(found?.ratings.size).toBe(2)
    expect(found?.ratings.get('Secundaria')).toEqual({ value: 1215 })
    expect(found?.ratings.get('Primaria')).toEqual({ value: 800 })
  })
})
