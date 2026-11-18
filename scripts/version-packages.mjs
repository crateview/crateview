import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { apps } from './release-plan.mjs';

const directories = Object.keys(apps).map((app) => `apps/${app}`);
const version = (directory) => JSON.parse(readFileSync(`${directory}/package.json`, 'utf8')).version;
const before = directories.map(version);
const run = (...args) => execFileSync('npm', args, { stdio: 'inherit' });

run('exec', '--no', '--', 'changeset', 'version');
for (const [index, directory] of directories.entries()) {
  if (version(directory) !== before[index]) {
    run('install', '--prefix', directory, '--package-lock-only', '--ignore-scripts');
  }
}
