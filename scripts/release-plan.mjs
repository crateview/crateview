export const apps = {
  'registry-ui': { baseline: '0.8.2', prefix: 'v', context: 'apps/registry-ui' },
  website: { baseline: '0.4.10', prefix: 'website-v', context: '.' },
};

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parts(version) {
  if (!versionPattern.test(version)) throw new Error(`Invalid stable version: ${version}`);
  return version.split('.').map(BigInt);
}

function compare(left, right) {
  const a = parts(left);
  const b = parts(right);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

export function releasePlan(app, version, tags, published, pending, { branch }) {
  if (!Object.hasOwn(apps, app)) throw new Error(`Unknown app: ${app}`);
  const { baseline, prefix, context } = apps[app];
  const tag = `${prefix}${version}`;
  const newer = tags.some(
    (entry) =>
      entry.startsWith(prefix) &&
      versionPattern.test(entry.slice(prefix.length)) &&
      compare(entry.slice(prefix.length), version) > 0,
  );
  const active = branch === 'refs/heads/main';
  const eligible = compare(version, baseline) > 0 && !newer;
  return {
    context,
    image: `ghcr.io/crateview/${app}`,
    imageTag: `v${version}`,
    tag,
    build: active && eligible && !pending && !tags.includes(tag),
    release: active && eligible && !pending && !published.includes(tag),
  };
}
