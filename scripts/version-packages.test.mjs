import { deepEqual, equal } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { recordPublication } from './docs-publication.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const apps = ['registry-ui', 'website'];

for (const pending of [[], ['registry-ui'], ['website'], apps]) {
  test(`plans and versions only affected packages: ${pending.join(', ') || 'none'}`, (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'crateview-version-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    for (const directory of ['.changeset', 'docs', 'scripts', ...apps.map((app) => `apps/${app}`)]) {
      mkdirSync(join(dir, directory), { recursive: true });
    }
    for (const file of [
      'package.json',
      'lerna.json',
      '.changeset/config.json',
      'scripts/release-plan.mjs',
      'scripts/docs-publication.mjs',
      'scripts/version-packages.mjs',
    ]) {
      copyFileSync(join(root, file), join(dir, file));
    }
    symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir');
    for (const app of apps) {
      const path = join(dir, 'apps', app);
      const name = `@crateview/${app}`;
      writeFileSync(join(path, 'package.json'), JSON.stringify({ name, version: '1.0.0', private: true }));
      writeFileSync(
        join(path, 'package-lock.json'),
        JSON.stringify({ name, version: '1.0.0', lockfileVersion: 3, packages: { '': { name, version: '1.0.0' } } }),
      );
      if (pending.includes(app) && app !== 'website') {
        writeFileSync(join(dir, '.changeset', `${app}.md`), `---\n"${name}": patch\n---\n\nFixture update.\n`);
      }
    }
    const tag = 'v1.2.3';
    const ledger = join(dir, 'docs/publications.json');
    if (pending.includes('website')) {
      writeFileSync(ledger, '{}');
      recordPublication(
        dir,
        { schema: 2, tag, registryRevision: 'fixture-revision' },
        { version: 'v1.2', revision: 'fixture-revision', files: ['capture.webp'] },
      );
    }
    const run = (command, args) =>
      execFileSync(command, args, {
        cwd: dir,
        env: { ...process.env, GITHUB_ACTIONS: 'false' },
        stdio: 'pipe',
      });
    run('git', ['init', '-b', 'main']);
    run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'Fixture']);
    run('npm', ['run', 'changeset', '--', 'status', '--output', 'plan.json']);
    const plan = JSON.parse(readFileSync(join(dir, 'plan.json'), 'utf8'));
    deepEqual(
      plan.releases.map(({ name }) => name).sort(),
      pending.map((app) => `@crateview/${app}`).sort(),
    );
    if (pending.length) run(process.execPath, ['scripts/version-packages.mjs']);
    for (const app of apps) {
      const files = ['package.json', 'package-lock.json'].map((file) =>
        JSON.parse(readFileSync(join(dir, 'apps', app, file), 'utf8')),
      );
      const version = pending.includes(app) ? '1.0.1' : '1.0.0';
      deepEqual(
        files.map((file) => file.version),
        [version, version],
      );
      equal(files[1].packages[''].version, version);
      equal(existsSync(join(dir, 'apps', app, 'CHANGELOG.md')), pending.includes(app));
    }
    if (pending.includes('website')) {
      equal(JSON.parse(readFileSync(ledger, 'utf8'))[tag].websiteVersion, '1.0.1');
      equal(existsSync(join(dir, '.changeset', `docs-${tag}.md`)), false);
    }
  });
}
