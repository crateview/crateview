// Temporary local hardening for GHSA-fc5q-39xc-vjpf. Keep the website copy in sync.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const expectedHashes = {
  '2.3.2': '3a91656f440069aa8f8e15c9d695b9f6b2209df1eab2be8127c72cbcca45ff5f',
  '4.0.7': '4e1e05447668aa1e94366c5516a2bcd8f5fff800cc92b1d0cd7d77703b8618c4',
};
const before = '  const extglobOpen = (type, value) => {\n';
const after =
  before +
  "    if (type === 'plus' || type === 'star') {\n" +
  "      throw new SyntaxError('Repeated extglobs are disabled');\n" +
  '    }\n\n';
const root = new URL('../', import.meta.url);
const { packages } = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
const copies = Object.entries(packages).filter(([path]) => /(?:^|\/)node_modules\/picomatch$/.test(path));
if (copies.length === 0) throw new Error('No locked picomatch packages; review the hardening patch');

for (const [path, locked] of copies) {
  const file = new URL(`${path}/lib/parse.js`, root);
  const source = await readFile(file, 'utf8');
  const original = source.replace(after, before);
  const hash = createHash('sha256').update(original).digest('hex');
  if (!original.includes(before) || hash !== expectedHashes[locked.version]) {
    throw new Error(`Review the picomatch hardening patch: ${path}@${locked.version}`);
  }
  if (source === original) await writeFile(file, original.replace(before, after));
}
