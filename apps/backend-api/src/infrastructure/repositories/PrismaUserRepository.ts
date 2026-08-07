import type { PrismaClient } from '@prisma/client'
import type { AcademicLevel, Difficulty, User, UserId, UserRepository } from '@mathmind/shared-domain'

type UserWithRatings = Awaited<ReturnType<PrismaClient['user']['findUniqueOrThrow']>> & {
  ratings: { academicLevel: AcademicLevel; value: number }[]
}

// Implementacion de UserRepository (packages/shared-domain) sobre Prisma.
// Ver docs/ADR/ADR-013_modelo_datos_fisico.md (tabla `users` + `user_ratings`).
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id }, include: { ratings: true } })
    return row ? this.toDomain(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email }, include: { ratings: true } })
    return row ? this.toDomain(row) : null
  }

  async save(user: User): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          academicLevel: user.academicLevel,
          currentStreak: user.currentStreak,
          scorePoints: user.score.points,
          createdAt: user.createdAt,
        },
        update: {
          email: user.email,
          academicLevel: user.academicLevel,
          currentStreak: user.currentStreak,
          scorePoints: user.score.points,
        },
      }),
      ...[...user.ratings.entries()].map(([academicLevel, difficulty]) =>
        this.prisma.userRating.upsert({
          where: { userId_academicLevel: { userId: user.id, academicLevel } },
          create: { userId: user.id, academicLevel, value: difficulty.value },
          update: { value: difficulty.value },
        }),
      ),
    ])
  }

  private toDomain(row: UserWithRatings): User {
    const ratings = new Map<AcademicLevel, Difficulty>(
      row.ratings.map((rating) => [rating.academicLevel, { value: rating.value }]),
    )
    return {
      id: row.id as UserId,
      email: row.email,
      academicLevel: row.academicLevel,
      ratings,
      currentStreak: row.currentStreak,
      score: { points: row.scorePoints },
      createdAt: row.createdAt,
    }
  }
}
