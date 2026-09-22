import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...await walk(full))
    else if (entry.name.endsWith('.css')) found.push(full)
  }
  return found
}

const root = fileURLToPath(new URL('../src/', import.meta.url))
const files = await walk(root)
for (const file of files) {
  const text = await readFile(file, 'utf8')
  let depth = 0
  for (const char of text) { if (char === '{') depth++; if (char === '}') depth--; if (depth < 0) throw new Error(`${file}: unexpected closing brace`) }
  if (depth !== 0) throw new Error(`${file}: unbalanced braces (${depth})`)
}
console.log(`Checked ${files.length} CSS files`)
