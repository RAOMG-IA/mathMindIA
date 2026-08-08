import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NodeIngestionFileSystem } from './NodeIngestionFileSystem.js'

// Test de integracion real contra el sistema de ficheros (directorios temporales aislados por
// test, sin depender de Postgres) -- ver vitest.integration.config.ts.
describe('NodeIngestionFileSystem (integration)', () => {
  let root: string
  let inputDir: string
  let historyDir: string
  let fileSystem: NodeIngestionFileSystem

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'mathmind-rag-'))
    inputDir = join(root, 'input')
    historyDir = join(root, 'history')
    await mkdir(inputDir, { recursive: true })
    await mkdir(historyDir, { recursive: true })
    fileSystem = new NodeIngestionFileSystem(inputDir, historyDir)
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('listInputFiles: devuelve los ficheros del directorio de entrada', async () => {
    await writeFile(join(inputDir, 'a.txt'), 'contenido a')
    await writeFile(join(inputDir, 'b.md'), 'contenido b')

    const files = await fileSystem.listInputFiles()

    expect([...files].sort()).toEqual(['a.txt', 'b.md'])
  })

  it('listInputFiles: array vacio si el directorio de entrada esta vacio', async () => {
    expect(await fileSystem.listInputFiles()).toEqual([])
  })

  it('readFile: devuelve el contenido del fichero', async () => {
    await writeFile(join(inputDir, 'a.txt'), 'contenido real de a')

    expect(await fileSystem.readFile('a.txt')).toBe('contenido real de a')
  })

  it('moveToHistory: mueve el fichero de entrada a historico de verdad', async () => {
    await writeFile(join(inputDir, 'a.txt'), 'contenido a')

    await fileSystem.moveToHistory('a.txt')

    expect(await readdir(inputDir)).toEqual([])
    expect(await readdir(historyDir)).toEqual(['a.txt'])
    expect(await readFile(join(historyDir, 'a.txt'), 'utf-8')).toBe('contenido a')
  })
})
