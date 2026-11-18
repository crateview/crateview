import { fixtureImage, seedCaptureRegistry } from './seed-capture-registry.mjs'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

const source = resolve(process.env.REGISTRY_SOURCE)
const image = process.env.REGISTRY_RELEASE_IMAGE
if (image && !/^ghcr\.io\/crateview\/registry-ui@sha256:[a-f0-9]{64}$/.test(image))
  throw new Error('Expected a digest-pinned registry UI image')
const version = process.argv[2]
const root = await mkdtemp(join(tmpdir(), 'crateview-capture-'))
const name = `crateview-capture-${randomUUID()}`
const password = randomUUID()
const secret = randomUUID()
const reservation = createServer()
await new Promise((resolve) => reservation.listen(0, '0.0.0.0', resolve))
const port = reservation.address().port
await new Promise((resolve) => reservation.close(resolve))
const baseURL = `http://127.0.0.1:${port}`
const children = []
let auth
let logs = ''
const docker = (args, input, env) =>
  execFileSync('docker', args, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env, DOCKER_CONFIG: join(root, 'docker') },
  }).trim()
async function ready(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).status < 500) return
    } catch {
      /* Startup. */
    }
    await delay(500)
  }
  throw new Error(`Fixture startup failed: ${url}\n${logs}`)
}
async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    children.push(child)
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed (${code})`)),
    )
  })
}
try {
  const { Store } = await import(pathToFileURL(join(source, 'auth/src/store.mjs')))
  const { authServer } = await import(pathToFileURL(join(source, 'auth/src/server.mjs')))
  const directory = join(root, 'accounts')
  const store = new Store(directory)
  await store.setPassword('admin', password, { create: true })
  await store.setPassword('developer', randomUUID(), { create: true })
  auth = await authServer({ mode: 'htpasswd', directory, managementSecret: secret })
  await new Promise((resolve) => auth.listen(0, '127.0.0.1', resolve))
  await mkdir(join(root, 'docker'))
  await writeFile(
    join(root, 'config.yml'),
    `version: 0.1
storage:
  filesystem:
    rootdirectory: /var/lib/registry
  delete:
    enabled: true
auth:
  htpasswd:
    realm: Registry
    path: /accounts/htpasswd
http:
  addr: :5000
  debug:
    addr: :5001
    prometheus:
      enabled: true
      path: /metrics
notifications:
  endpoints:
    - name: capture
      url: http://host.docker.internal:${port}/api/monitoring/events
      headers:
        Authorization: ["Bearer ${secret}"]
      timeout: 5s
      threshold: 5
      backoff: 1s
`,
  )
  docker([
    'run',
    '-d',
    '--rm',
    '--name',
    name,
    '--add-host',
    'host.docker.internal:host-gateway',
    '-p',
    '127.0.0.1::5000',
    '-p',
    '127.0.0.1::5001',
    '--tmpfs',
    '/var/lib/registry',
    '-v',
    `${directory}:/accounts:ro`,
    '-v',
    `${root}/config.yml:/etc/distribution/config.yml:ro`,
    '-e',
    'OTEL_TRACES_EXPORTER=none',
    'registry:3.1.2',
  ])
  const published = (containerPort) => docker(['port', name, containerPort]).split(':').at(-1)
  const registry = `127.0.0.1:${published('5000/tcp')}`
  await ready(`http://${registry}/v2/`)
  const env = {
    HOST: '0.0.0.0',
    PORT: String(port),
    NUXT_REGISTRY_UPSTREAM: `http://${registry}`,
    NUXT_REGISTRY_DELETE_ENABLED: 'true',
    NUXT_AUTH_MODE: 'htpasswd',
    NUXT_AUTH_SERVICE_URL: `http://127.0.0.1:${auth.address().port}`,
    NUXT_AUTH_SERVICE_SECRET: secret,
    NUXT_USER_CREATION_ALLOWED_USERS: 'admin',
    NUXT_SESSION_PASSWORD: randomUUID(),
    NUXT_MONITORING_ENABLED: 'true',
    NUXT_MONITORING_METRICS_URL: `http://127.0.0.1:${published('5001/tcp')}/metrics`,
    NUXT_MONITORING_WEBHOOK_SECRET: secret,
    NUXT_MONITORING_DATABASE_PATH: image
      ? '/app/data/monitoring.sqlite'
      : join(root, 'monitoring.sqlite'),
  }
  if (image) {
    docker(['pull', image])
    const expected = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim()
    const revision = docker([
      'image',
      'inspect',
      '--format',
      '{{index .Config.Labels "org.opencontainers.image.revision"}}',
      image,
    ])
    if (revision !== expected) throw new Error('Capture image does not match the pinned release')
    docker(
      [
        'run',
        '-d',
        '--name',
        name + '-ui',
        '--network',
        'host',
        ...Object.keys(env).flatMap((key) => ['-e', key]),
        image,
      ],
      undefined,
      env,
    )
  } else {
    const app = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: source,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    })
    children.push(app)
    for (const stream of [app.stdout, app.stderr])
      stream.on('data', (chunk) => {
        logs = (logs + chunk).slice(-12000)
      })
  }
  await ready(baseURL + '/login')
  await seedCaptureRegistry(`http://${registry}`, password)
  await run(
    process.execPath,
    ['scripts/capture-screenshots.mjs', '--version', version, '--overwrite'],
    {
      env: {
        ...process.env,
        UI_BASE_URL: baseURL,
        CAPTURE_FIXTURE_IMAGE: fixtureImage,
        UI_SCREENSHOT_USERNAME: 'admin',
        UI_SCREENSHOT_PASSWORD: password,
      },
    },
  )
} finally {
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM')
  if (auth) await new Promise((resolve) => auth.close(resolve))
  if (image) {
    try {
      docker(['rm', '-f', name + '-ui'])
    } catch {
      /* UI may not have started. */
    }
  }
  try {
    docker(['rm', '-f', name])
  } catch {
    /* Container may not have started. */
  }
  await rm(root, { recursive: true, force: true })
}
