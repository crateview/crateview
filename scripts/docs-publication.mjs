import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function recordPublication(root, request, capture) {
  const file = resolve(root, 'docs/publications.json');
  const ledger = JSON.parse(readFileSync(file, 'utf8'));
  if (request.schema !== 2 || !/^v\d+\.\d+\.\d+$/.test(request.tag))
    throw new Error('Expected a monorepo promotion receipt');
  const series = request.tag.replace(/\.\d+$/, '');
  if (
    capture.version !== series ||
    capture.revision !== request.registryRevision ||
    !Array.isArray(capture.files) ||
    !capture.files.length
  )
    throw new Error('Capture manifest does not match the promoted docs');
  const existing = ledger[request.tag];
  if (existing) {
    for (const [key, value] of Object.entries(request))
      if (existing[key] !== value) throw new Error(`Conflicting publication for ${request.tag}`);
    return false;
  }
  ledger[request.tag] = { ...request, capture: `images/docs/${series}/capture.json` };
  writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n');
  writeFileSync(
    resolve(root, `.changeset/docs-${request.tag}.md`),
    `---\n"@crateview/website": patch\n---\n\nPublish documentation and verified captures for registry UI ${request.tag}.\n`,
    { flag: 'wx' },
  );
  return true;
}

export function assignWebsiteVersion(root, version, promotedTags) {
  if (!promotedTags.length) return false;
  const file = resolve(root, 'docs/publications.json');
  const ledger = JSON.parse(readFileSync(file, 'utf8'));
  for (const tag of promotedTags) {
    if (ledger[tag]?.schema !== 2 || ledger[tag].websiteVersion) throw new Error(`Unexpected docs release: ${tag}`);
    ledger[tag].websiteVersion = version;
  }
  writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n');
  return true;
}
