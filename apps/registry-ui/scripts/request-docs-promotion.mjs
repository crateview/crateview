import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateReceipt(receipt, tag, registryRevision, imageDigest) {
  if (
    receipt.schema !== 2 ||
    receipt.tag !== tag ||
    receipt.registryRevision !== registryRevision ||
    receipt.docsRevision !== registryRevision ||
    !/^[a-f0-9]{40}$/.test(registryRevision) ||
    receipt.docsPath !== 'docs' ||
    !/^sha256:[a-f0-9]{64}$/.test(imageDigest) ||
    receipt.imageDigest !== imageDigest
  )
    throw new Error('Conflicting documentation promotion receipt');
  return receipt;
}
export async function requestPromotion(tag, imageDigest) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) throw new Error('Expected stable release tag');
  const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
  const revision = execFileSync('git', ['rev-list', '-n', '1', tag], { encoding: 'utf8' }).trim();
  const release = JSON.parse(gh(['release', 'view', tag, '--json', 'isDraft,isPrerelease,assets']));
  if (release.isDraft || release.isPrerelease) throw new Error('Cannot promote a preview release');
  const directory = await mkdtemp(join(tmpdir(), 'crateview-docs-request-'));
  try {
    const file = join(directory, 'docs-promotion.json');
    if (release.assets.some((asset) => asset.name === 'docs-promotion.json')) {
      gh(['release', 'download', tag, '--pattern', 'docs-promotion.json', '--dir', directory]);
      validateReceipt(JSON.parse(await readFile(file, 'utf8')), tag, revision, imageDigest);
    } else {
      execFileSync('git', ['cat-file', '-e', `${revision}:docs/versions.json`]);
      const receipt = validateReceipt(
        { schema: 2, tag, registryRevision: revision, docsRevision: revision, docsPath: 'docs', imageDigest },
        tag,
        revision,
        imageDigest,
      );
      await writeFile(file, JSON.stringify(receipt, null, 2) + '\n');
      gh(['release', 'upload', tag, file]); // Never clobber a pinned request on retry.
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await requestPromotion(process.argv[2], process.argv[3]);
