import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const upstream = {
  '2.3.2': 'V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==',
  '4.0.7': 'qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==',
};
const packageName = '@crateview/picomatch-hardened';
const marker = '  const extglobOpen = (type, value) => {\n';
const guard = [
  "    if (type === 'plus' || type === 'star') {",
  "      throw new SyntaxError('Repeated extglobs are disabled');",
  '    }',
  '',
  '',
].join('\n');

const directory = mkdtempSync(join(tmpdir(), 'crateview-picomatch-'));
const run = (file, args) => execFileSync(file, args, { cwd: directory, encoding: 'utf8' });

try {
  for (const [version, integrity] of Object.entries(upstream)) {
    const [{ filename }] = JSON.parse(
      run('npm', ['pack', `picomatch@${version}`, '--registry=https://registry.npmjs.org', '--json', '--ignore-scripts']),
    );
    if (createHash('sha512').update(readFileSync(join(directory, filename))).digest('base64') !== integrity) {
      throw new Error(`Upstream integrity mismatch: picomatch@${version}`);
    }
    run('tar', ['-xzf', filename]);
    const manifest = join(directory, 'package/package.json');
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    if (pkg.name !== 'picomatch' || pkg.version !== version) throw new Error('Unexpected upstream package');
    pkg.name = packageName;
    pkg.description = `Crateview's temporary hardened fork of picomatch ${version}`;
    writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);

    const parser = join(directory, 'package/lib/parse.js');
    const source = readFileSync(parser, 'utf8');
    if (source.split(marker).length !== 2) throw new Error(`Review the hardening patch for ${version}`);
    writeFileSync(parser, source.replace(marker, marker + guard));

    const [{ filename: hardened }] = JSON.parse(run('npm', ['pack', './package', '--json', '--ignore-scripts']));
    for (const app of ['registry-ui', 'website']) {
      const target = fileURLToPath(new URL(`../apps/${app}/vendor/${hardened}`, import.meta.url));
      if (process.argv.includes('--check')) {
        if (!readFileSync(target).equals(readFileSync(join(directory, hardened)))) {
          throw new Error(`Hardened package does not match its sources: ${target}`);
        }
      } else {
        copyFileSync(join(directory, hardened), target);
      }
    }
    rmSync(join(directory, 'package'), { recursive: true });
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
