import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// E2E del build web de Expo contra el backend real (ADR-018). Los mismos tests corren bajo los
// projects `web` (desktop) y `mobile` (emulacion Pixel 7 del build web) -- por eso las capturas
// se guardan una por project. Playwright ejecuta con cwd = dir de config (apps/mobile-app), por
// eso las capturas caen bajo ./test-results sin depender del formato de modulo del paquete.

const SCREENSHOTS_DIR = join(process.cwd(), 'test-results', 'screenshots')

function screenshotPath(name: string): string {
  const project = test.info().project.name
  const dir = join(SCREENSHOTS_DIR, project)
  mkdirSync(dir, { recursive: true })
  return join(dir, name)
}

// Email unico por ejecucion (usuarios se crean contra un Postgres compartido en CI).
function uniqueEmail(): string {
  return `e2e.${Date.now()}.${test.info().workerIndex}@mathmind.test`
}

const PASSWORD = 'MathMind-e2e-123'
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000'

test.describe('UI (web + mobile)', () => {
  test('login screen renders y navega a home', async ({ page, request }) => {
    const email = uniqueEmail()
    // Crea la cuenta por API para poder loguear por UI (los repositorios son reales en CI).
    const reg = await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: PASSWORD, academicLevel: 'Primaria' },
    })
    expect(reg.ok()).toBeTruthy()

    await page.goto('/login')
    await expect(page.getByText('MathMind AI')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await page.screenshot({ path: screenshotPath('login.png'), fullPage: true })

    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Contraseña').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()

    // (app)/_layout.tsx redirige a /(app)/home al autenticarse (sessionRouting).
    await expect(page).toHaveURL(/home/)
    await expect(page.getByText('Nueva sesión de entrenamiento')).toBeVisible({ timeout: 15_000 })
    await page.screenshot({ path: screenshotPath('home.png'), fullPage: true })
  })

  test('register screen render con selector de nivel', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Crea tu cuenta para empezar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nivel de complejidad: Primaria' })).toBeVisible()
    await page.screenshot({ path: screenshotPath('register.png'), fullPage: true })
  })
})

test.describe('Contrato API (backend real)', () => {
  // El flujo de contrato no depende del viewport: correrlo tambien en `mobile` seria trabajo
  // duplicado en CI. Solo en `web`. test.skip(callback, description) a nivel de describe solo
  // recibe fixtures (ConditionBody<TestArgs>, sin testInfo) -- test.skip(condition, description)
  // dentro de un beforeEach si recibe (fixtures, testInfo).
  test.beforeEach((_fixtures, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'contrato API solo en project web')
  })

  test('flujo register -> login -> temas -> session -> answer -> statistics -> end', async ({ request }) => {
    const email = uniqueEmail()

    const register = await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: PASSWORD, academicLevel: 'Primaria' },
    })
    expect(register.ok()).toBeTruthy()
    const { userId, sessionToken } = await register.json()
    expect(userId).toBeTruthy()
    expect(sessionToken).toBeTruthy()

    const bearer = { Authorization: `Bearer ${sessionToken}` }

    const login = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password: PASSWORD },
    })
    expect(login.ok()).toBeTruthy()

    const temas = await request.get(`${API_BASE_URL}/temas`, { headers: bearer })
    expect(temas.ok()).toBeTruthy()
    const { temas: temasList } = await temas.json()
    const tema = temasList.find((t: { code: string }) => t.code === 'arit.suma-resta')
    expect(tema).toBeTruthy()

    // El seed de main.ts crea UN ejercicio (Resolution, arit.suma-resta, respuesta 42).
    const start = await request.post(`${API_BASE_URL}/sessions`, {
      headers: bearer,
      data: { mode: 'Resolution', academicLevel: 'Primaria', topic: 'arit.suma-resta' },
    })
    expect(start.ok()).toBeTruthy()
    const { session, exercise } = await start.json()
    expect(session.id).toBeTruthy()
    expect(exercise.statement).toBe('15 + 27')

    const answer = await request.post(`${API_BASE_URL}/answers`, {
      headers: bearer,
      data: { sessionId: session.id, exerciseId: exercise.id, submittedValue: '42', responseTimeMs: 1200 },
    })
    expect(answer.ok()).toBeTruthy()
    const answerBody = await answer.json()
    expect(answerBody.isCorrect).toBe(true)

    const stats = await request.get(`${API_BASE_URL}/users/me/statistics`, { headers: bearer })
    expect(stats.ok()).toBeTruthy()

    const end = await request.post(`${API_BASE_URL}/sessions/end`, {
      headers: bearer,
      data: { sessionId: session.id },
    })
    expect(end.ok()).toBeTruthy()
    const endBody = await end.json()
    expect(endBody.correctAttempts).toBe(1)
    expect(endBody.ratingChange).toBeGreaterThan(0)
  })

  test('sin token, /temas devuelve 401', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/temas`)
    expect(res.status()).toBe(401)
  })
})