import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const host = '127.0.0.1'
const port = '4174'
const baseURL = `http://${host}:${port}`

const server = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', '--host', host, '--port', port, '--strictPort'],
  {
    env: { ...process.env, FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

let serverOutput = ''

server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

server.on('exit', (code) => {
  if (code !== null && code !== 0) {
    process.stderr.write(serverOutput)
    process.exitCode = code
  }
})

const waitForServer = async () => {
  const deadline = Date.now() + 120_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL)

      if (response.ok) {
        return
      }
    } catch {
      // Vite is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Timed out waiting for ${baseURL}`)
}

const runPlaywright = () =>
  new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        'node_modules/@playwright/test/cli.js',
        'test',
        '--config=playwright.e2e.config.mjs',
      ],
      {
        env: {
          ...process.env,
          PWTEST_CACHE_DIR: fileURLToPath(
            new URL('../node_modules/.cache/playwright', import.meta.url),
          ),
        },
        stdio: 'inherit',
      },
    )

    child.on('error', () => resolve(1))
    child.on('exit', (code) => resolve(code ?? 1))
  })

try {
  await waitForServer()
  const code = await runPlaywright()
  process.exitCode = code
} catch (error) {
  process.exitCode = 1
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.stderr.write(serverOutput)
} finally {
  server.kill()
}
