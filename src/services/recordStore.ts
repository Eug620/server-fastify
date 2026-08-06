import { join } from 'node:path'
import { unlink, stat } from 'node:fs/promises'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

export type RecordType = 'wn' | 'hs' | 'db' | 'xb' | 'sj'

export interface RecordItem {
  id?: string
  type: RecordType
  ml: string
  img: string
  h: string
  timestamp: number
}

const ROOT_DIR = join(__dirname, '..', '..')
const DATA_DIR = join(ROOT_DIR, 'data')
const DATA_FILE = join(DATA_DIR, 'records.json')
const PUBLIC_DIR = join(ROOT_DIR, 'public')

let initialized = false

async function ensureStore(): Promise<void> {
  if (initialized) return
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await stat(DATA_FILE)
  } catch {
    await writeFile(DATA_FILE, '[]', 'utf-8')
  }
  initialized = true
}

async function readAll(): Promise<RecordItem[]> {
  await ensureStore()
  const raw = await readFile(DATA_FILE, 'utf-8')
  return JSON.parse(raw) as RecordItem[]
}

async function writeAll(records: RecordItem[]): Promise<void> {
  await ensureStore()
  await writeFile(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8')
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 根据图片存储路径（如 /2026-08-05/xxx.png）解析实际文件路径
 * 同时支持以 / 开头和不以 / 开头的路径
 */
function resolveImagePath(imgPath: string): string | null {
  if (!imgPath) return null
  const relativePath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath
  if (!relativePath) return null
  return join(PUBLIC_DIR, relativePath)
}

/**
 * 安全删除图片文件（文件不存在时静默忽略）
 */
async function safeDeleteImage(imgPath: string): Promise<void> {
  const resolved = resolveImagePath(imgPath)
  if (!resolved) return
  try {
    await stat(resolved)
    await unlink(resolved)
  } catch {
    // 文件不存在或权限不足时静默忽略
  }
}

export const recordStore = {
  async list(dateStr?: string): Promise<RecordItem[]> {
    const records = await readAll()
    const filtered = dateStr
      ? records.filter(r => formatDate(r.timestamp) === dateStr)
      : records
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  },

  async create(data: Omit<RecordItem, 'id'>): Promise<RecordItem> {
    const records = await readAll()
    const record: RecordItem = { ...data, id: generateId() }
    records.push(record)
    await writeAll(records)
    return record
  },

  async delete(id: string): Promise<boolean> {
    const records = await readAll()
    const idx = records.findIndex(r => r.id === id)
    if (idx === -1) return false
    const [removed] = records.splice(idx, 1)
    // 先删除图片，再写回数据
    if (removed.img) {
      await safeDeleteImage(removed.img)
    }
    await writeAll(records)
    return true
  },

  async clear(): Promise<void> {
    const records = await readAll()
    // 先删除所有图片，再清空数据
    for (const r of records) {
      if (r.img) {
        await safeDeleteImage(r.img)
      }
    }
    await writeAll([])
  }
}
