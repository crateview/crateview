import { deepEqual, equal, match, ok } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

function releaseFixture(t, websiteVersion = '0.4.10', registryVersion = '0.8.2') {
  const dir = mkdtempSync(join(tmpdir(), 'crateview-publish-plan-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [app, version] of [
    ['registry-ui', registryVersion],
    ['website', websiteVersion],
  ]) {
    mkdirSync(join(dir, 'apps', app), { recursive: true });
    writeFileSync(join(dir, 'apps', app, 'package.json'), JSON.stringify({ version }));
  }
  const fixtures = `
const { appendFileSync, existsSync, writeFileSync } = require('node:fs');
const tool = require('node:path').basename(process.argv[1]);
const args = process.argv.slice(2);
const [cmd, sub, detail] = args;
const revision = 'a'.repeat(40);
const digest = 'sha256:' + 'b'.repeat(64);
appendFileSync('commands', JSON.stringify([tool, ...args]) + '\\n');
if (tool === 'git') {
  if (cmd === 'rev-parse') console.log(revision);
  if (cmd === 'ls-remote' && detail === 'refs/heads/main')
    console.log(process.env.STALE_HEAD ? 'c'.repeat(40) : revision);
} else if (tool === 'gh') {
  if (cmd === 'api') console.log('[[]]');
} else if (tool === 'docker' && cmd === 'buildx' && sub === 'build') {
  writeFileSync(args[args.indexOf('--metadata-file') + 1], JSON.stringify({ 'containerimage.digest': digest }));
} else if (cmd === 'buildx' && sub === 'imagetools' && detail === 'inspect') {
  if (!existsSync(args.at(-1).replaceAll('/', '_'))) { console.error('manifest unknown'); process.exit(1); }
  console.log(JSON.stringify({ digest }));
} else if (cmd === 'buildx' && sub === 'imagetools' && detail === 'create') {
  writeFileSync(args[args.indexOf('--tag') + 1].replaceAll('/', '_'), digest);
} else if (cmd === 'image' && sub === 'inspect') console.log(process.env.WRONG_IMAGE ? 'wrong-source' : revision);
else if (cmd === 'run') console.log('fixture-container');
`;
  for (const tool of ['git', 'gh', 'docker'])
    writeFileSync(join(dir, tool), `#!${process.execPath}\n${fixtures}`, { mode: 0o700 });

  const env = {
    ...process.env,
    PATH: `${dir}:${process.env.PATH}`,
    GITHUB_REF: 'refs/heads/main',
    GITHUB_REPOSITORY: 'crateview/crateview',
    PENDING_RELEASE_PACKAGES: '[]',
  };
  delete env.CRATEVIEW_MONOREPO_PUBLISH;
  const run = (overrides = {}) =>
    spawnSync(process.execPath, [fileURLToPath(new URL('./release.mjs', import.meta.url))], {
      cwd: dir,
      env: { ...env, ...overrides },
      encoding: 'utf8',
    });
  const commands = () =>
    readFileSync(join(dir, 'commands'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));

  return { dir, run, commands };
}

test('off-branch and stale runs do not write release state', (t) => {
  const { run, commands } = releaseFixture(t);
  const offBranch = run({ GITHUB_REF: 'refs/heads/demo' });
  equal(offBranch.status, 0, offBranch.stderr);
  deepEqual(commands(), [['git', 'rev-parse', 'HEAD']]);

  const stale = run({ STALE_HEAD: 'true' });
  equal(stale.status, 0, stale.stderr);
  deepEqual(commands().slice(1), [
    ['git', 'rev-parse', 'HEAD'],
    ['git', 'ls-remote', 'origin', 'refs/heads/main'],
  ]);
});

test('pending website changes prevent publication and the container script never creates a PR', (t) => {
  const { run, commands } = releaseFixture(t, '0.4.11');
  const result = run({ PENDING_RELEASE_PACKAGES: '["@crateview/website"]' });
  equal(result.status, 0, result.stderr);
  ok(!commands().some(([tool, cmd]) => tool === 'docker' || (tool === 'gh' && ['release', 'pr'].includes(cmd))));
});

test('website publication verifies the digest and keeps the registry release stream untouched', (t) => {
  const { run, commands } = releaseFixture(t, '0.4.11');
  const invalid = run({ WRONG_IMAGE: 'true' });
  equal(invalid.status, 1, invalid.stderr);
  match(invalid.stderr, /Release image source revision mismatch/);
  ok(!commands().some((args) => args.includes('ghcr.io/crateview/website:latest')));
  ok(!commands().some(([tool, command]) => tool === 'gh' && command === 'release'));

  const published = run();
  equal(published.status, 0, published.stderr);
  const calls = commands();
  const smoke = calls.findIndex((args) => args[0] === 'docker' && args[1] === 'exec');
  const latest = calls.findIndex((args) => args.includes('ghcr.io/crateview/website:latest'));
  ok(smoke > 0 && latest > smoke);
  deepEqual(calls.find((args) => args[0] === 'git' && args[1] === 'tag' && args[2] !== '--list')?.slice(0, 3), [
    'git',
    'tag',
    'website-v0.4.11',
  ]);
  const release = calls.find((args) => args[0] === 'gh' && args[1] === 'release');
  match(release.join(' '), /website-v0.4.11 .*--latest=false/);
  ok(!calls.some((args) => args.join(' ').includes('ghcr.io/crateview/registry-ui:')));
});

test('one merged Version Packages PR can publish two distinct container releases', (t) => {
  const { run, commands } = releaseFixture(t, '0.4.11', '0.9.0');
  const result = run();
  equal(result.status, 0, result.stderr);
  const calls = commands();
  deepEqual(
    calls.filter(([tool, command, tag]) => tool === 'git' && command === 'tag' && tag !== '--list').map((args) => args[2]),
    ['v0.9.0', 'website-v0.4.11'],
  );
  ok(calls.some((args) => args.includes('ghcr.io/crateview/registry-ui:v0.9.0')));
  ok(calls.some((args) => args.includes('ghcr.io/crateview/website:v0.4.11')));
});
