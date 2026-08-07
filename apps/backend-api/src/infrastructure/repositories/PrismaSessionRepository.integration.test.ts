import type { Session, SessionId, UserId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaSessionRepository } from './PrismaSessionRepository.js'

describe('PrismaSessionRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaSessionRepository(prisma)
  const createdSessionIds: SessionId[] = []
  const createdUserIds: UserId[] = []

  afterEach(async () => {
    await prisma.session.deleteMany({ where: { id: { in: createdSessionIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    createdSessionIds.length = 0
    createdUserIds.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function aUserId(): Promise<UserId> {
    const id = crypto.randomUUID() as UserId
    createdUserIds.push(id)
    await prisma.user.create({
      data: { id, email: `user-${id}@example.com`, academicLevel: 'Secundaria' },
    })
    return id
  }

  function aSession(userId: UserId, overrides: Partial<Session> = {}): Session {
    const id = crypto.randomUUID() as SessionId
    createdSessionIds.push(id)
    return {
      id,
      userId,
      mode: 'Resolution',
      academicLevel: 'Secundaria',
      topic: 'arit.suma-resta',
      ratingAtStart: { value: 1200 },
      startedAt: new Date('2026-01-01T10:00:00.000Z'),
      ...overrides,
    }
  }

  it('save + findById: round-trip de una Session activa (sin endedAt)', async () => {
    const userId = await aUserId()
    const session = aSession(userId)

    await repository.save(session)
    const found = await repository.findById(session.id)

    expect(found).toEqual(session)
  })

  it('save + findById: persiste endedAt cuando la Session ya termino', async () => {
    const userId = await aUserId()
    const session = aSession(userId, { endedAt: new Date('2026-01-01T10:20:00.000Z') })

    await repository.save(session)
    const found = await repository.findById(session.id)

    expect(found?.endedAt).toEqual(session.endedAt)
  })

  it('findById: devuelve null si no existe', async () => {
    const found = await repository.findById('does-not-exist' as SessionId)
    expect(found).toBeNull()
  })

  it('save: upsert -- finalizar una Session existente actualiza en vez de duplicar', async () => {
    const userId = await aUserId()
    const session = aSession(userId)
    await repository.save(session)

    const ended = { ...session, endedAt: new Date('2026-01-01T10:30:00.000Z') }
    await repository.save(ended)

    const found = await repository.findById(session.id)
    expect(found?.endedAt).toEqual(ended.endedAt)
  })
})
