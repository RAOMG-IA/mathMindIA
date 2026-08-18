import { defineConfig, devices } from '@playwright/test'

// Config E2E del build web de Expo (ADR-018).
// - `web-*`: viewport desktop.
// - `mobile-*`: emulacion de dispositivo sobre el MISMO build web (ADR-015: una sola base de
//   codigo Android/iOS/Web). NO es el binario nativo -- ver ADR-018 "Fuera de alcance".
// El backend real y el build web estatico los levanta `webServer` (ver *.env / workflow).
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000'
const WEB_BASE_URL = process.env.E2E_WEB_BASE_URL ?? 'http://localhost:8081'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : 'list',
  outputDir: 'test-results',

  use: {
    baseURL: WEB_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'web',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: [
    {
      command: 'npm run e2e:serve',
      cwd: './',
      url: WEB_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Backend real (ADR-018: "backend real en CI", no mock). Requiere migracion + `prisma
      // generate` previos (los ejecuta el workflow). El seed de main.ts crea el ejercicio 42 al
      // arrancar. Sin AI_API_KEY/AI_BASE_URL, POST /hints devuelve 403 a proposito (no forma
      // parte del flujo e2e obligatorio, ver ADR-018 #6).
      command: 'npm run dev --workspace @mathmind/backend-api',
      cwd: '../..',
      url: `${API_BASE_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})