import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
const request = JSON.parse(await readFile(process.env.REQUEST_FILE, 'utf8'))
const ledger = JSON.parse(await readFile('docs-publications.json', 'utf8'))
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const version = pkg.version.split('.').map(Number)
version[2]++
pkg.version = version.join('.')
await writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n')
execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], { stdio: 'inherit' })
const docsCommit = execFileSync('git', ['-C', 'content', 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim()
ledger[request.tag] = { ...request, docsCommit, websiteVersion: pkg.version }
await writeFile('docs-publications.json', JSON.stringify(ledger, null, 2) + '\n')
