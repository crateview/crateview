import { deepEqual, equal, throws } from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assignWebsiteVersion, recordPublication } from './docs-publication.mjs';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'docs-ledger-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'docs'));
  mkdirSync(join(dir, 'apps/website/.changeset'), { recursive: true });
  const file = join(dir, 'docs/publications.json');
  const legacy = { schema: 1, tag: 'v0.8.2', websiteVersion: '0.4.10' };
  writeFileSync(file, JSON.stringify({ [legacy.tag]: legacy }));
  const revision = 'a'.repeat(40);
  const request = {
    schema: 2,
    tag: 'v0.8.3',
    registryRevision: revision,
    docsRevision: revision,
    docsPath: 'docs',
    imageDigest: 'sha256:' + 'b'.repeat(64),
  };
  return {
    dir,
    read: () => JSON.parse(readFileSync(file, 'utf8')),
    legacy,
    request,
    capture: { version: 'v0.8', revision, files: ['overview.webp'] },
  };
}

test('staging a patch is idempotent and keeps previous publication records', (t) => {
  const { dir, read, legacy, request, capture } = fixture(t);
  equal(recordPublication(dir, request, capture), true);
  equal(recordPublication(dir, request, capture), false);
  equal(existsSync(join(dir, 'apps/website/.changeset/docs-v0.8.3.md')), true);
  equal(assignWebsiteVersion(dir, '0.4.12', [request.tag]), true);
  equal(read()[request.tag].websiteVersion, '0.4.12');
  deepEqual(read()[legacy.tag], legacy);
  throws(() => recordPublication(dir, { ...request, imageDigest: 'conflict' }, capture), /Conflicting publication/);
});

test('an invalid capture stages nothing and a website-only version does not trigger promotion', (t) => {
  const { dir, read, legacy, request, capture } = fixture(t);
  throws(() => recordPublication(dir, request, { ...capture, version: 'v0.7' }), /Capture manifest/);
  equal(assignWebsiteVersion(dir, '0.4.11', []), false);
  deepEqual(read(), { [legacy.tag]: legacy });
});
