import { defineConfig } from 'vitepress'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')

function findAllMd(): string[] {
  const sources: { dir: string; recursive: boolean }[] = [
    { dir: join(ROOT, 'business'), recursive: true },
    { dir: join(ROOT, 'architectures'), recursive: true },
    { dir: join(ROOT, 'modules'), recursive: true },
  ]
  const files: string[] = []

  for (const { dir, recursive } of sources) {
    if (!existsSync(dir)) continue
    const entries = readdirSync(dir, { recursive, withFileTypes: true })
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.md')) continue
      if (e.name === 'README.md' || e.name === 'index.md') continue
      const full = join(e.parentPath || dir, e.name)
      // Root: only direct files, no subdirs
      if (!recursive && full !== join(dir, e.name)) continue
      if (full.includes('node_modules') || full.includes('.vitepress') || full.includes('.git') || full.includes('.commandcode')) continue
      const rel = full.replace(ROOT, '').replace(/^\//, '')
      files.push(rel)
    }
  }
  return files
}

function getTitle(path: string, fallback: string): string {
  try {
    const m = readFileSync(path, 'utf-8').match(/^#\s+(.+)/m)
    return m ? m[1] : fallback
  } catch { return fallback }
}

function humanize(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function buildSidebar() {
  const files = findAllMd()
  const sectionDirs = ['business', 'architectures', 'modules']
  const groups: Record<string, { text: string; link: string }[]> = {}
  for (const d of sectionDirs) groups[d] = []

  const labels: Record<string, string> = {
    business: 'Bisnis',
    architectures: 'Arsitektur',
    modules: 'Modul',
  }

  for (const rel of files) {
    const top = rel.split('/')[0]
    if (!groups[top]) continue
    const link = '/' + rel.replace(/\.md$/, '')
    const title = getTitle(join(ROOT, rel), humanize(rel.split('/').pop()!.replace(/\.md$/, '')))
    groups[top].push({ text: title, link })
  }

  for (const k of Object.keys(groups)) {
    groups[k].sort((a, b) => a.text.localeCompare(b.text))
  }

  const sidebar: Record<string, any[]> = {}
  for (const [k, items] of Object.entries(groups)) {
    if (items.length === 0) continue
    sidebar[`/${k}/`] = [{ text: labels[k], items }]
  }
  return sidebar
}

const sidebar = buildSidebar()

export default defineConfig({
  srcDir: '.',
  outDir: '.vitepress/dist',
  base: '/HR-SYSTEM-DOCS/',
  title: 'HR System',
  description: 'Dokumentasi HR Management System',
  lang: 'id-ID',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#1e40af' }],
  ],

  themeConfig: {
    logo: { light: '/logo-light.svg', dark: '/logo-dark.svg' },
    nav: [
      { text: 'Beranda', link: '/' },
      ...(sidebar['/business/'] ? [{ text: 'Bisnis', link: '/business/' }] : []),
      ...(sidebar['/architectures/'] ? [{ text: 'Arsitektur', link: '/architectures/' }] : []),
      ...(sidebar['/modules/'] ? [{ text: 'Modul', link: '/modules/' }] : []),
    ],
    sidebar,
    socialLinks: [{ icon: 'github', link: 'https://github.com/YubiRepo/HR-SYSTEM-DOCS' }],
    footer: { message: 'Dokumentasi HR Management System', copyright: 'Copyright © 2026 — Tim HR' },
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'Di halaman ini' },
    docFooter: { prev: 'Sebelumnya', next: 'Selanjutnya' },
    darkModeSwitchLabel: 'Tema',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Kembali ke atas',
  },

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: true,
  },

  vite: {
    server: { fs: { allow: ['..'] } },
  },
})
