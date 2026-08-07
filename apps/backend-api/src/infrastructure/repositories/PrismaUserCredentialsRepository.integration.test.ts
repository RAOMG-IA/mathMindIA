import type { UserCredentials, UserId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaUserCredentialsRepository } from './PrismaUserCredentialsRepository.js'

describe('PrismaUserCredentialsRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaUserCredentialsRepository(prisma)
  const createdUserIds: UserId[] = []

  afterEach(async () => {
    await prisma.userCredentials.deleteMany({ where: { userId: { in: createdUserIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
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

  it('save + findByUserId: round-trip', async () => {
    const userId = await aUserId()
    const credentials: UserCredentials = { userId, passwordHash: '$2b$12$fakehash' }

    await repository.save(credentials)
    const found = await repository.findByUserId(userId)

    expect(found).toEqual(credentials)
  })

  it('findByUserId: null si no existe', async () => {
    const userId = await aUserId()
    expect(await repository.findByUserId(userId)).toBeNull()
  })

  it('save: upsert -- un cambio de contrasena actualiza en vez de duplicar', async () => {
    const userId = await aUserId()
    await repository.save({ userId, passwordHash: 'old-hash' })
    await repository.save({ userId, passwordHash: 'new-hash' })

    const found = await repository.findByUserId(userId)
    expect(found?.passwordHash).toBe('new-hash')
  })
})
