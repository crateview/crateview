import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Store } from '../auth/src/store.mjs';

const root = await mkdtemp(join(tmpdir(), 'crateview-gc-api-'));
const children = [];
const servers = [];
const password = 'local-test-password';
const adapterToken = 'local-test-adapter-token';
const path = '/api/registry/garbage-collection';
let snapshot = { revision: 'r0', run: null };
let failure = false;
let calls = 0;
let starts = 0;

async function listen(server, protocol = 'http') {
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `${protocol}://127.0.0.1:${server.address().port}`;
}

async function startApp(upstream, origin, enabled) {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const { port } = reservation.address();
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      NODE_EXTRA_CA_CERTS: join(root, 'fixture.crt'),
      NUXT_REGISTRY_UPSTREAM: upstream,
      NUXT_SESSION_PASSWORD: 'local-test-session-secret-at-least-32-chars',
      NUXT_AUTH_MODE: 'htpasswd',
      NUXT_AUTH_DATA_DIR: join(root, 'auth'),
      NUXT_AUTH_SERVICE_URL: '',
      NUXT_AUTH_SERVICE_SECRET: '',
      NUXT_REGISTRY_GARBAGE_COLLECTION_ENABLED: String(enabled),
      NUXT_REGISTRY_GARBAGE_COLLECTION_ORIGIN: origin,
      NUXT_REGISTRY_GARBAGE_COLLECTION_TOKEN: adapterToken,
      NUXT_REGISTRY_GARBAGE_COLLECTION_ALLOWED_USERS: 'operator',
    },
  });
  children.push(child);
  let diagnostics = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => (diagnostics += chunk));
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 80 && child.exitCode === null; i++) {
    const response = await fetch(`${url}/`).catch(() => undefined);
    if (response?.ok) {
      await response.body?.cancel();
      return url;
    }
    await response?.body?.cancel();
    await setTimeout(125);
  }
  throw new Error(`Crateview did not start: ${diagnostics}`);
}

async function login(url, username) {
  const response = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: url },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(response.status, 200, await response.text());
  return response.headers.get('set-cookie').split(';')[0];
}

async function expectResponse(url, status, { cookie, body, origin = url, type = 'application/json' } = {}) {
  const response = await fetch(url + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body !== undefined ? { Origin: origin, 'Content-Type': type } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, status, text);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(text, /local-test-adapter-token|fixture-private-output/);
  return JSON.parse(text);
}

try {
  const store = new Store(join(root, 'auth'));
  await store.setPassword('operator', password, { create: true });
  await store.setPassword('reader', password, { create: true });
  const basic = (user) => `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  const upstream = await listen(
    createServer((request, response) => {
      if (request.url !== '/v2/') return response.writeHead(404).end();
      if (['operator', 'reader'].some((user) => basic(user) === request.headers.authorization))
        return response.writeHead(200).end('{}');
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="fixture"' }).end();
    }),
  );
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      join(root, 'fixture.key'),
      '-out',
      join(root, 'fixture.crt'),
      '-days',
      '1',
      '-subj',
      '/CN=127.0.0.1',
      '-addext',
      'subjectAltName=IP:127.0.0.1',
    ],
    { stdio: 'ignore' },
  );
  const adapter = await listen(
    createHttpsServer(
      { key: await readFile(join(root, 'fixture.key')), cert: await readFile(join(root, 'fixture.crt')) },
      async (request, response) => {
        calls++;
        if (request.url !== '/garbage-collection' || request.headers.authorization !== `Bearer ${adapterToken}`)
          return response.writeHead(401).end();
        const reply = (code, data) =>
          response.writeHead(code, { 'Content-Type': 'application/json' }).end(JSON.stringify(data));
        if (failure) return reply(200, { message: 'fixture-private-output' });
        if (request.method === 'GET') return reply(200, snapshot);
        let body = '';
        for await (const chunk of request) body += chunk;
        if (JSON.parse(body).revision !== snapshot.revision || snapshot.run?.state === 'running') return reply(409, {});
        starts++;
        snapshot = { revision: 'r1', run: { id: 'run-1', state: 'running' } };
        reply(202, { ...snapshot, logs: 'fixture-private-output' });
      },
    ),
    'https',
  );
  const [url, other, off] = await Promise.all([
    startApp(upstream, adapter, true),
    startApp(upstream, adapter, true),
    startApp(upstream, adapter, false),
  ]);
  const cookie = await login(url, 'operator');
  const reader = await login(url, 'reader');
  const secondCookie = await login(other, 'operator');
  await expectResponse(off, 404, { cookie });
  await expectResponse(url, 401);
  await expectResponse(url, 403, { cookie: reader });
  await expectResponse(url, 403, { cookie, body: { revision: 'r0' }, origin: 'https://other.test' });
  await expectResponse(url, 403, { cookie: reader, body: { revision: 'r0' } });
  await expectResponse(url, 400, { cookie, body: { revision: 'r0', target: 'other' } });
  await expectResponse(url, 400, { cookie, body: { revision: 'r0' }, type: 'text/plain' });
  assert.equal(calls, 0);
  assert.deepEqual(await expectResponse(url, 200, { cookie }), snapshot);
  const start = async (app, session) => {
    const response = await fetch(app + path, {
      method: 'POST',
      headers: { Cookie: session, Origin: app, 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: 'r0' }),
    });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const text = await response.text();
    assert.doesNotMatch(text, /fixture-private-output/);
    return response.status;
  };
  assert.deepEqual((await Promise.all([start(url, cookie), start(other, secondCookie)])).sort(), [202, 409]);
  assert.equal(starts, 1);
  assert.deepEqual(await expectResponse(other, 200, { cookie: secondCookie }), snapshot);
  snapshot = { revision: 'r2', run: { id: 'run-1', state: 'succeeded' } };
  assert.deepEqual(await expectResponse(url, 200, { cookie }), snapshot);
  await expectResponse(url, 409, { cookie, body: { revision: 'r0' } });
  failure = true;
  await expectResponse(url, 502, { cookie });
  assert.equal(starts, 1);
  console.log('GC HTTP integration passed (real Crateview/session, synthetic registry and provider).');
} finally {
  await Promise.all(
    children.map(async (child) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const closed = once(child, 'exit');
      child.kill();
      await closed;
    }),
  );
  for (const server of servers) server.closeAllConnections();
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  await rm(root, { recursive: true, force: true });
}
