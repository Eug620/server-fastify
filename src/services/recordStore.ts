import { join } from 'node:path'
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

const DATA_DIR = join(__dirname, '..', '..', 'data')
const DATA_FILE = join(DATA_DIR, 'records.json')

let initialized = false

async function ensureStore(): Promise<void> {
  if (initialized) return
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await readFile(DATA_FILE, 'utf-8')
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
    records.splice(idx, 1)
    await writeAll(records)
    return true
  },

  async clear(): Promise<void> {
    await writeAll([])
  }
}
