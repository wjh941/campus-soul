import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('../src/', import.meta.url))
const files = (await readdir(root)).filter(file => file.endsWith('.css'))
for (const file of files) {
  const text = await readFile(join(root, file), 'utf8')
  let depth = 0
  for (const char of text) { if (char === '{') depth++; if (char === '}') depth--; if (depth < 0) throw new Error(`${file}: unexpected closing brace`) }
  if (depth !== 0) throw new Error(`${file}: unbalanced braces (${depth})`)
}
console.log(`Checked ${files.length} CSS files`)
