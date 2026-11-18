import { deepEqual, equal } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const apps = ['registry-ui', 'website'];

for (const pending of [['registry-ui'], ['website'], apps]) {
  test(`versions only affected packages: ${pending.join(', ')}`, (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'crateview-version-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    for (const directory of ['.changeset', 'scripts', ...apps.map((app) => `apps/${app}`)]) {
      mkdirSync(join(dir, directory), { recursive: true });
    }
    for (const file of ['package.json', 'lerna.json', '.changeset/config.json', 'scripts/release-plan.mjs', 'scripts/version-packages.mjs']) {
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
      if (pending.includes(app)) {
        writeFileSync(join(dir, '.changeset', `${app}.md`), `---\n"${name}": patch\n---\n\nFixture update.\n`);
      }
    }
    execFileSync(process.execPath, ['scripts/version-packages.mjs'], { cwd: dir, stdio: 'pipe' });
    for (const app of apps) {
      const files = ['package.json', 'package-lock.json'].map((file) =>
        JSON.parse(readFileSync(join(dir, 'apps', app, file), 'utf8')),
      );
      const version = pending.includes(app) ? '1.0.1' : '1.0.0';
      deepEqual(files.map((file) => file.version), [version, version]);
      equal(files[1].packages[''].version, version);
    }
  });
}
