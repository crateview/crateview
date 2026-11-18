import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { apps, releasePlan } from './release-plan.mjs';
import { requestPromotion } from '../apps/registry-ui/scripts/request-docs-promotion.mjs';
import { assignWebsiteVersion } from './docs-publication.mjs';

const config = { branch: process.env.GITHUB_REF, enabled: process.env.CRATEVIEW_MONOREPO_PUBLISH };
const get = (program, args) => execFileSync(program, args, { encoding: 'utf8' }).trim();
const run = (program, args) => execFileSync(program, args, { stdio: 'inherit' });
const git = (...args) => get('git', args);
const gh = (...args) => get('gh', args);
const committed = git('rev-parse', 'HEAD');

function currentMain() {
  return git('ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0] === committed;
}

function versionPr(app, directory) {
  const branch = `changeset-release/${app}`;
  const title = `chore: release ${app}`;
  const existing = gh('pr', 'list', '--head', branch, '--base', 'main', '--json', 'number', '--jq', '.[0].number');
  const previous = git('ls-remote', 'origin', `refs/heads/${branch}`).split(/\s/)[0];
  if (previous) {
    run('git', ['fetch', 'origin', branch]);
    if (existing && git('rev-parse', `${previous}^`) === committed) return;
  }
  run('git', ['switch', '-C', branch, committed]);
  try {
    const promotedTags =
      app === 'website'
        ? readdirSync(`${directory}/.changeset`)
            .filter((name) => /^docs-v\d+\.\d+\.\d+\.md$/.test(name))
            .map((name) => name.slice(5, -3))
        : [];
    run('npm', ['ci', '--prefix', directory]);
    run('npm', ['--prefix', directory, 'run', 'version']);
    run('git', ['add', '--', directory]);
    const { version } = JSON.parse(readFileSync(`${directory}/package.json`, 'utf8'));
    if (assignWebsiteVersion(process.cwd(), version, promotedTags)) run('git', ['add', '--', 'docs/publications.json']);
    run('git', ['commit', '-m', `chore: version ${app}`]);
    if (!currentMain()) throw new Error('Main advanced; recompute release plan on the new head');
    run('git', ['push', `--force-with-lease=refs/heads/${branch}:${previous}`, 'origin', branch]);
    const number =
      existing ||
      gh(
        'pr',
        'create',
        '--head',
        branch,
        '--base',
        'main',
        '--title',
        title,
        '--body',
        `Version ${app} with Changesets.`,
      );
    // GITHUB_TOKEN pushes are not a reliable way to trigger PR checks.
    run('gh', ['workflow', 'run', 'ci.yml', '--ref', branch]);
    console.log(`Version PR for ${app}: ${number}`);
  } finally {
    run('git', ['switch', '--detach', committed]);
  }
}

function imageRevision(image) {
  run('docker', ['pull', image]);
  return get('docker', [
    'image',
    'inspect',
    '--format',
    '{{index .Config.Labels "org.opencontainers.image.revision"}}',
    image,
  ]);
}

async function smoke(app, image, revision) {
  const actual = imageRevision(image);
  if (actual !== revision) throw new Error('Release image source revision mismatch');
  const id = get('docker', ['run', '-d', '--network', 'none', image]);
  try {
    const endpoint = app === 'website' ? '/docs/overview' : '/manifest.webmanifest';
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        run('docker', [
          'exec',
          id,
          'node',
          '-e',
          'fetch(process.argv[1]).then(async (res) => { if (!res.ok || !(await res.text()).length) process.exitCode = 1 })',
          `http://127.0.0.1:3000${endpoint}`,
        ]);
        return;
      } catch (error) {
        if (attempt === 19) throw error;
        await delay(1000);
      }
    }
  } finally {
    run('docker', ['rm', '-f', id]);
  }
}

function imageDigest(ref) {
  try {
    return JSON.parse(get('docker', ['buildx', 'imagetools', 'inspect', '--format', '{{json .Manifest}}', ref])).digest;
  } catch (error) {
    if (/manifest unknown|not found/i.test(String(error.stderr))) return undefined;
    throw error;
  }
}

async function publish(app, plan) {
  const imageRef = `${plan.image}:${plan.imageTag}`;
  if (plan.build && !imageDigest(imageRef)) {
    if (!currentMain()) throw new Error('Main advanced; recompute release plan on the new head');
    const dir = mkdtempSync(join(tmpdir(), 'crateview-build-'));
    const metadata = join(dir, 'build.json');
    let candidate;
    try {
      run('docker', [
        'buildx',
        'build',
        '--push',
        '--metadata-file',
        metadata,
        '--platform',
        'linux/amd64',
        '--file',
        `apps/${app}/Dockerfile`,
        '--label',
        `org.opencontainers.image.revision=${committed}`,
        '--tag',
        `${plan.image}:sha-${committed.slice(0, 7)}`,
        plan.context,
      ]);
      candidate = JSON.parse(readFileSync(metadata, 'utf8'))['containerimage.digest'];
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    if (!/^sha256:[a-f0-9]{64}$/.test(candidate)) throw new Error('Build did not return an image digest');
    const digestRef = `${plan.image}@${candidate}`;
    await smoke(app, digestRef, committed);
    if (!currentMain()) throw new Error('Main advanced; retry publication on the new head');
    run('docker', ['buildx', 'imagetools', 'create', '--tag', imageRef, digestRef]);
  }
  const digest = imageDigest(imageRef);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error(`Invalid release image digest for ${imageRef}`);
  const digestRef = `${plan.image}@${digest}`;
  const revision = plan.build ? imageRevision(digestRef) : git('rev-parse', `${plan.tag}^{commit}`);
  if (plan.build && revision !== committed) {
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Existing release image has no source revision');
    run('git', ['merge-base', '--is-ancestor', revision, committed]);
    const pkg = JSON.parse(git('show', `${revision}:apps/${app}/package.json`));
    if (`v${pkg.version}` !== plan.imageTag) throw new Error('Existing release image version mismatch');
  }
  await smoke(app, digestRef, revision);
  if (!currentMain()) throw new Error('Main advanced; retry publication on the new head');
  if (plan.build) {
    run('git', ['tag', plan.tag, revision]);
    run('git', ['push', 'origin', `refs/tags/${plan.tag}`]);
  }
  // Update the watched alias only after the candidate image and its version tag exist.
  run('docker', ['buildx', 'imagetools', 'create', '--tag', `${plan.image}:latest`, digestRef]);
  if (plan.release)
    run('gh', ['release', 'create', plan.tag, '--generate-notes', '--verify-tag', `--latest=${app === 'registry-ui'}`]);
}

if (config.enabled === 'true' && config.branch === 'refs/heads/main' && currentMain()) {
  const tags = git('tag', '--list').split('\n');
  const releases = JSON.parse(
    gh('api', '--paginate', '--slurp', `repos/${process.env.GITHUB_REPOSITORY}/releases?per_page=100`),
  )
    .flat()
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => release.tag_name);
  for (const app of Object.keys(apps)) {
    const directory = `apps/${app}`;
    const { version } = JSON.parse(readFileSync(`${directory}/package.json`, 'utf8'));
    const pending = readdirSync(`${directory}/.changeset`).some((name) => name !== 'README.md' && name.endsWith('.md'));
    const plan = releasePlan(app, version, tags, releases, pending, config);
    if (plan.versionPr) versionPr(app, directory);
    else if (plan.build || plan.release) await publish(app, plan);
  }
  const registry = apps['registry-ui'];
  for (const tag of git('tag', '--list', 'v*').split('\n')) {
    const version = tag.slice(1);
    if (!/^\d+\.\d+\.\d+$/.test(version)) continue;
    const [major, minor, patch] = version.split('.').map(Number);
    if (major === 0 && (minor < 8 || (minor === 8 && patch <= 2))) continue;
    const release = JSON.parse(gh('api', `repos/${process.env.GITHUB_REPOSITORY}/releases/tags/${tag}`));
    if (release.assets.some((asset) => asset.name === 'docs-promotion.json')) continue;
    const ref = `ghcr.io/crateview/registry-ui:${registry.prefix}${version}`;
    const digest = imageDigest(ref);
    if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error(`Invalid registry image digest for ${tag}`);
    await smoke('registry-ui', `ghcr.io/crateview/registry-ui@${digest}`, git('rev-parse', `${tag}^{commit}`));
    await requestPromotion(tag, digest);
  }
}
