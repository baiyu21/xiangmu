export interface ClientComment {
  id: string
  author: string
  role: string
  content: string
  at: string
}

export interface ChangeDoc {
  id: string
  title: string
  at: string
  author: string
  summary: string
  aiBrief?: string
  clientComments?: ClientComment[]
}

export interface MappedFile {
  id: string
  projectId: string
  module: string
  path: string
  authors: string[]
  lastAt: string
  lastAuthor: string
  aiBrief?: string
  docs: ChangeDoc[]
}

export type MapMode = 'module' | 'repo'
export type SortKey = 'count' | 'recent' | 'path'

export interface TreeNode {
  key: string
  label: string
  count: number
  kids?: TreeNode[]
  fileId?: string
}

export function changeCountOf(file: MappedFile): number {
  return file.docs.length
}

export function statsOf(files: MappedFile[]) {
  const authors = new Set<string>()
  let changes = 0
  let docs = 0
  for (const f of files) {
    f.authors.forEach((a) => authors.add(a))
    changes += changeCountOf(f)
    docs += f.docs.length
  }
  return {
    files: files.length,
    changes,
    authors: authors.size,
    docs,
  }
}

export function buildModuleNodes(list: MappedFile[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  for (const f of list) {
    if (!map.has(f.module)) {
      map.set(f.module, {
        key: `mod:${f.module}`,
        label: f.module,
        count: 0,
        kids: [],
      })
    }
    const n = map.get(f.module)!
    n.count += changeCountOf(f)
    n.kids!.push({
      key: `file:${f.id}`,
      label: f.path.split('/').pop() || f.path,
      count: changeCountOf(f),
      fileId: f.id,
    })
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export function buildRepoNodes(list: MappedFile[]): TreeNode[] {
  const root: TreeNode = { key: 'dir:', label: '仓库根目录', count: 0, kids: [] }

  const ensure = (node: TreeNode, name: string, key: string): TreeNode => {
    if (!node.kids) node.kids = []
    let child = node.kids.find((c) => c.label === name && c.kids)
    if (!child) {
      child = { key, label: name, count: 0, kids: [] }
      node.kids.push(child)
    }
    return child
  }

  for (const f of list) {
    const parts = f.path.split('/')
    let cur = root
    root.count += changeCountOf(f)
    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1
      if (isFile) {
        if (!cur.kids) cur.kids = []
        cur.kids.push({
          key: `file:${f.id}`,
          label: part,
          count: changeCountOf(f),
          fileId: f.id,
        })
      } else {
        const dirKey = `dir:${parts.slice(0, idx + 1).join('/')}`
        cur = ensure(cur, part, dirKey)
        cur.count += changeCountOf(f)
      }
    })
  }
  return [root]
}

export function filterFiles(
  list: MappedFile[],
  query: string,
  scope: string,
  mode: MapMode,
): MappedFile[] {
  const q = query.trim().toLowerCase()
  let rows = list

  if (scope !== 'all') {
    if (scope.startsWith('mod:')) {
      const mod = scope.slice(4)
      rows = rows.filter((f) => f.module === mod)
    } else if (scope.startsWith('file:')) {
      const id = scope.slice(5)
      rows = rows.filter((f) => f.id === id)
    } else if (scope.startsWith('dir:')) {
      const dir = scope.slice(4)
      rows = rows.filter((f) => (dir ? f.path.startsWith(`${dir}/`) || f.path === dir : true))
    }
  }

  if (q) {
    rows = rows.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.authors.some((a) => a.toLowerCase().includes(q)) ||
        f.module.toLowerCase().includes(q),
    )
  }

  // mode unused for filter itself but kept for API symmetry with scope labels
  void mode
  return rows
}

export function sortFiles(list: MappedFile[], sort: SortKey): MappedFile[] {
  const rows = [...list]
  if (sort === 'count') {
    rows.sort((a, b) => changeCountOf(b) - changeCountOf(a))
  } else if (sort === 'recent') {
    rows.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
  } else {
    rows.sort((a, b) => a.path.localeCompare(b.path))
  }
  return rows
}

export function scopeLabel(scope: string, mode: MapMode): string {
  if (scope === 'all') return mode === 'module' ? '全部模块' : '全部路径'
  if (scope.startsWith('mod:')) return scope.slice(4)
  if (scope.startsWith('file:')) return '单文件'
  if (scope.startsWith('dir:')) return scope.slice(4) || '仓库根目录'
  return scope
}

export function formatPath(path: string): { dir: string; name: string } {
  const parts = path.split('/')
  const name = parts.pop() || path
  const dir = parts.length ? `${parts.join('/')}/` : ''
  return { dir, name }
}
