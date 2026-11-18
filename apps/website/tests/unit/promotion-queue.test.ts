import { afterEach, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
const receipt = (tag: string) => ({
  schema: 1,
  tag,
  registryRevision: 'a'.repeat(40),
  docsRevision: 'b'.repeat(40),
})
async function queue(
  tags: string[],
  recorded: Record<string, object> = {},
  moveTag = false,
  published = false,
  monorepo = false,
) {
  const root = await mkdtemp(join(tmpdir(), 'docs-queue-test-'))
  roots.push(root)
  await mkdir(join(root, 'content'))
  await writeFile(
    join(root, 'content/versions.json'),
    JSON.stringify({ stable: 'v0.5', versions: [{ id: 'v0.5', release: 'v0.5.0' }] }),
  )
  await writeFile(join(root, 'docs-publications.json'), JSON.stringify(recorded))
  const answers: Record<string, unknown> = {
    'repos/crateview/registry-ui/releases?per_page=100&page=1': tags.map((tag, id) => ({
      tag_name: tag,
      assets: [{ id, name: 'docs-promotion.json' }],
    })),
  }
  tags.forEach((tag, id) => {
    answers['repos/crateview/registry-ui/releases/assets/' + id] = monorepo
      ? {
          ...receipt(tag),
          schema: 2,
          docsRevision: receipt(tag).registryRevision,
          docsPath: 'docs',
          imageDigest: 'sha256:' + 'd'.repeat(64),
        }
      : receipt(tag)
    answers['repos/crateview/registry-ui/commits/' + tag] = {
      sha: (moveTag ? 'c' : 'a').repeat(40),
    }
  })
  if (published)
    answers['repos/crateview/website/releases/tags/v0.4.2'] = { draft: false, prerelease: false }
  await writeFile(join(root, 'answers.json'), JSON.stringify(answers))
  await writeFile(
    join(root, 'gh'),
    `#!/usr/bin/env node\nconst fs = require('node:fs'); const answers = JSON.parse(fs.readFileSync('${root}/answers.json')); const key = process.argv.at(-1); if (!(key in answers)) process.exit(1); console.log(JSON.stringify(answers[key]));\n`,
    { mode: 0o755 },
  )
  const file = join(root, 'request.json')
  const run = () =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('../../scripts/select-docs-release.mjs', import.meta.url))],
      {
        cwd: root,
        env: {
          ...process.env,
          DOCS_MANIFEST: join(root, 'content/versions.json'),
          DOCS_PUBLICATIONS: join(root, 'docs-publications.json'),
          GITHUB_REPOSITORY: 'crateview/registry-ui',
          MONOREPO_PROMOTION: String(monorepo),
          PATH: root + ':' + process.env.PATH,
          REQUEST_FILE: file,
          GITHUB_OUTPUT: join(root, 'output'),
        },
        stdio: 'pipe',
      },
    )
  return { run, file }
}
it('processes durable requests oldest first even when dispatch ordering differs', async () => {
  const { run, file } = await queue(['v0.7.0', 'v0.6.1', 'v0.6.0'])
  run()
  expect(JSON.parse(await readFile(file, 'utf8')).tag).toBe('v0.6.0')
})
it('recovers failed image publication without promoting or bumping again', async () => {
  const entry = { ...receipt('v0.6.0'), docsCommit: 'c'.repeat(40), websiteVersion: '0.4.2' }
  const { run, file } = await queue(['v0.6.0'], { 'v0.6.0': entry })
  run()
  expect(JSON.parse(await readFile(file, 'utf8')).recovery).toEqual(entry)
})
it('skips successfully published requests', async () => {
  const entry = { ...receipt('v0.6.0'), websiteVersion: '0.4.2' }
  const { run, file } = await queue(['v0.6.0'], { 'v0.6.0': entry }, false, true)
  run()
  await expect(readFile(file)).rejects.toThrow()
})
it('rejects moved tags and changed receipts', async () => {
  const moved = await queue(['v0.6.0'], {}, true)
  expect(moved.run).toThrow()
  const changed = await queue(['v0.6.0'], {
    'v0.6.0': { ...receipt('v0.6.0'), docsRevision: 'c'.repeat(40) },
  })
  expect(changed.run).toThrow()
})
it('skips older requests without rolling back stable', async () => {
  const { run, file } = await queue(['v0.4.9'])
  run()
  await expect(readFile(file)).rejects.toThrow()
})

it('selects a pinned monorepo release and waits for its reviewed website version', async () => {
  const first = await queue(['v0.7.0', 'v0.6.0'], {}, false, false, true)
  first.run()
  const selected = JSON.parse(await readFile(first.file, 'utf8'))
  expect(selected).toMatchObject({ tag: 'v0.6.0', schema: 2, docsPath: 'docs' })
  expect(selected.docsRevision).toBe(selected.registryRevision)
  const waiting = await queue(['v0.7.0', 'v0.6.0'], { 'v0.6.0': selected }, false, false, true)
  waiting.run()
  await expect(readFile(waiting.file)).rejects.toThrow()
})
