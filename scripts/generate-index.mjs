import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const DIRS = ['business', 'architectures', 'modules']

const labels = {
  business: 'Bisnis',
  architectures: 'Arsitektur',
  modules: 'Modul',
}

for (const dir of DIRS) {
  const fullDir = join(ROOT, dir)
  if (!existsSync(fullDir)) continue

  const files = []
  const entries = readdirSync(fullDir, { recursive: true, withFileTypes: true })
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md') || e.name === 'index.md') continue
    const rel = relative(fullDir, join(e.parentPath || fullDir, e.name))
    files.push(rel.replace(/\.md$/, ''))
  }

  const links = files
    .sort()
    .map(f => {
      const name = f.split('/').pop()
      return `- [${name.replace(/[-_]/g, ' ')}](/${dir}/${f})`
    })
    .join('\n')

  writeFileSync(join(fullDir, 'index.md'), `# ${labels[dir]}\n\n${links || 'Belum ada dokumen.'}\n`)
  console.log(`  ✓ ${dir}/index.md (${files.length} file)`)
}
