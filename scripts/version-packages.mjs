import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { assignWebsiteVersion } from './docs-publication.mjs';
import { apps } from './release-plan.mjs';

const directories = Object.keys(apps).map((app) => `apps/${app}`);
const version = (directory) => JSON.parse(readFileSync(`${directory}/package.json`, 'utf8')).version;
const before = directories.map(version);
const promotedTags = readdirSync('.changeset')
  .filter((name) => /^docs-v\d+\.\d+\.\d+\.md$/.test(name))
  .map((name) => name.slice(5, -3));
const websiteBefore = version('apps/website');
const run = (...args) => execFileSync('npm', args, { stdio: 'inherit' });

function assertCurrentMain() {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const remote = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], { encoding: 'utf8' });
  if (remote.split(/\s/)[0] !== process.env.GITHUB_SHA) {
    throw new Error('Main advanced; recompute the Version Packages PR on the new head');
  }
}

assertCurrentMain();
if (process.env.PUBLISHED_DOCS_PATCH === 'true') {
  writeFileSync(
    '.changeset/published-docs.md',
    '---\n"@crateview/website": patch\n---\n\nUpdate the published documentation.\n',
    { flag: 'wx' },
  );
}
run('exec', '--no', '--', 'changeset', 'version');
for (const [index, directory] of directories.entries()) {
  if (version(directory) !== before[index]) {
    run('install', '--prefix', directory, '--package-lock-only', '--ignore-scripts');
  }
}
const websiteVersion = version('apps/website');
if (promotedTags.length && websiteVersion === websiteBefore) {
  throw new Error('Promoted docs changesets must release the website');
}
assignWebsiteVersion(process.cwd(), websiteVersion, promotedTags);
assertCurrentMain();
