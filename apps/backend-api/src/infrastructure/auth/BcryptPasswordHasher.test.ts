// Trazabilidad: ADR-012 (docs/ADR/ADR-012_linea_base_seguridad.md, "hash con algoritmo
// estandar bcrypt o argon2"). Sin fakes: bcrypt es computo puro, se testea con la libreria
// real (a diferencia de LangChainQwenModel/Prisma*, que dependen de red/DB).
//
// TDD Red: BcryptPasswordHasher todavia no tiene implementacion (declare class, sin cuerpo).
// Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import { BcryptPasswordHasher } from './BcryptPasswordHasher.js'

describe('BcryptPasswordHasher', () => {
  it('hash() produce un valor distinto de la contrasena en texto plano', async () => {
    const hasher = new BcryptPasswordHasher()

    const hash = await hasher.hash('super-secreta')

    expect(hash).not.toBe('super-secreta')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('verify() devuelve true para la contrasena correcta', async () => {
    const hasher = new BcryptPasswordHasher()
    const hash = await hasher.hash('super-secreta')

    await expect(hasher.verify('super-secreta', hash)).resolves.toBe(true)
  })

  it('verify() devuelve false para una contrasena incorrecta', async () => {
    const hasher = new BcryptPasswordHasher()
    const hash = await hasher.hash('super-secreta')

    await expect(hasher.verify('otra-cosa', hash)).resolves.toBe(false)
  })

  it('dos hashes de la misma contrasena son distintos (salt aleatorio)', async () => {
    const hasher = new BcryptPasswordHasher()

    const hash1 = await hasher.hash('super-secreta')
    const hash2 = await hasher.hash('super-secreta')

    expect(hash1).not.toBe(hash2)
  })
})
