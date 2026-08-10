import { describe, expect, it } from 'vitest'
import type { FileSystemOperations } from './NodeIngestionFileSystem.js'
import { NodeIngestionFileSystem } from './NodeIngestionFileSystem.js'

// Unit tests del fallback EXDEV de moveToHistory (hallazgo de la verificacion DevOps
// 2026-08-10: en el contenedor Docker, rag/input y rag/history son bind mounts separados y
// rename() entre ellos lanza EXDEV). El fs se inyecta como fake -- misma convencion de DI
// del proyecto -- y los casos de integracion reales siguen en el fichero .integration.test.ts.
function exdevError(): NodeJS.ErrnoException {
  const error = new Error('cross-device link not permitted') as NodeJS.ErrnoException
  error.code = 'EXDEV'
  error.errno = -18
  return error
}

function createFileSystem(overrides: Partial<FileSystemOperations>): {
  fileSystem: NodeIngestionFileSystem
  calls: { rename: string[][]; copyFile: string[][]; unlink: string[] }
} {
  const calls: { rename: string[][]; copyFile: string[][]; unlink: string[] } = {
    rename: [],
    copyFile: [],
    unlink: [],
  }
  const fs: FileSystemOperations = {
    readdir: async () => [],
    readFile: async () => '',
    rename: async (from, to) => {
      calls.rename.push([from, to])
    },
    copyFile: async (from, to) => {
      calls.copyFile.push([from, to])
    },
    unlink: async (path) => {
      calls.unlink.push(path)
    },
    ...overrides,
  }
  return { fileSystem: new NodeIngestionFileSystem('/input', '/history', fs), calls }
}

describe('NodeIngestionFileSystem.moveToHistory (unit)', () => {
  it('rename feliz: mueve con rename() sin tocar copia/borrado', async () => {
    const { fileSystem, calls } = createFileSystem({})

    await fileSystem.moveToHistory('a.txt')

    expect(calls.rename).toEqual([['/input/a.txt', '/history/a.txt']])
    expect(calls.copyFile).toEqual([])
    expect(calls.unlink).toEqual([])
  })

  it('EXDEV: cae a copyFile+unlink y el resultado es el mismo (fichero en history)', async () => {
    const { fileSystem, calls } = createFileSystem({
      rename: async (from, to) => {
        calls.rename.push([from, to])
        throw exdevError()
      },
    })

    await fileSystem.moveToHistory('a.txt')

    expect(calls.rename).toEqual([['/input/a.txt', '/history/a.txt']])
    expect(calls.copyFile).toEqual([['/input/a.txt', '/history/a.txt']])
    expect(calls.unlink).toEqual(['/input/a.txt'])
  })

  it('error distinto de EXDEV: se propaga y no se cae a copia/borrado', async () => {
    const unexpected = new Error('disk is on fire')
    const { fileSystem, calls } = createFileSystem({
      rename: async () => {
        throw unexpected
      },
    })

    await expect(fileSystem.moveToHistory('a.txt')).rejects.toBe(unexpected)

    expect(calls.copyFile).toEqual([])
    expect(calls.unlink).toEqual([])
  })
})
