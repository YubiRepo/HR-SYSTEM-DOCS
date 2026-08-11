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
  const subDirs = new Set()
  const entries = readdirSync(fullDir, { recursive: true, withFileTypes: true })
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md') || e.name === 'index.md') continue
    const rel = relative(fullDir, join(e.parentPath || fullDir, e.name)).replace(/\.md$/, '')
    const parts = rel.split('/')
    if (parts.length > 1) subDirs.add(parts[0])
    files.push(rel)
  }

  // Group by subfolder
  const groups = {}
  for (const f of files) {
    const parts = f.split('/')
    const group = parts.length > 1 ? parts[0] : '__root__'
    if (!groups[group]) groups[group] = []
    groups[group].push(f)
  }

  let content = `# ${labels[dir]}\n\n`

  // Root files
  if (groups['__root__']) {
    for (const f of groups['__root__'].sort()) {
      const name = f.replace(/[-_]/g, ' ')
      content += `- [${name}](/${dir}/${f})\n`
    }
  }

  // Subfolder groups
  for (const [sub, subs] of Object.entries(groups)) {
    if (sub === '__root__') continue
    content += `\n### ${sub.replace(/[-_]/g, ' ')}\n\n`
    for (const f of subs.sort()) {
      const name = f.split('/').pop().replace(/[-_]/g, ' ')
      content += `- [${name}](/${dir}/${f})\n`
    }
  }

  writeFileSync(join(fullDir, 'index.md'), content || '# Belum ada dokumen.\n')
  console.log(`  ✓ ${dir}/index.md (${files.length} file)`)
}
