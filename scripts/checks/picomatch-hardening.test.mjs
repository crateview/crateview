import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

for (const app of ['registry-ui', 'website']) {
  const fromApp = createRequire(new URL(`../../apps/${app}/package.json`, import.meta.url));

  test(`${app}: every locked picomatch copy is hardened`, () => {
    const { packages } = JSON.parse(readFileSync(fromApp.resolve('./package-lock.json'), 'utf8'));
    const copies = Object.keys(packages).filter((path) => /(?:^|\/)node_modules\/picomatch$/.test(path));
    assert.ok(copies.length > 0);
    for (const path of copies) {
      assert.equal(packages[path].name, '@crateview/picomatch-hardened', path);
      assert.match(packages[path].resolved, /^file:vendor\/crateview-picomatch-hardened-/);
      assert.equal(fromApp(`./${path}/package.json`).name, '@crateview/picomatch-hardened', path);
      const match = fromApp(`./${path}`);
      assert.throws(() => match.makeRe('+(jpg|png)'), /Repeated extglobs are disabled/, path);
    }
  });

  for (const major of [4, 2]) {
    const loader = () => (major === 4 ? fromApp : createRequire(fromApp.resolve('micromatch')));

    test(`${app}: picomatch v${major} rejects repeated extglobs`, () => {
      const load = loader();
      const match = load('picomatch');
      assert.match(load('picomatch/package.json').version, new RegExp(`^${major}\\.`));
      for (const options of [{}, { capture: true }, { maxExtglobRecursion: false }]) {
        assert.throws(() => match.makeRe('+(jpg|png)', options), /Repeated extglobs are disabled/);
        assert.throws(() => match.parse('*(jpg|png)', options), /Repeated extglobs are disabled/);
      }
    });

    test(`${app}: picomatch v${major} retains standard glob behavior`, () => {
      const match = loader()('picomatch');
      assert.equal(match('**/*.@(jpg|png)')('assets/logo.png'), true);
      assert.equal(match('**/*.@(jpg|png)')('assets/logo.svg'), false);
      assert.equal(match('docs/?.md')('docs/a.md'), true);
      assert.equal(match('docs/?.md')('docs/ab.md'), false);
    });
  }
}
