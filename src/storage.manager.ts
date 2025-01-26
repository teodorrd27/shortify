import { env } from './env'
import { ShortenedURLEntry } from './types/storage.type'
import { createHash } from 'crypto'
import baseX from 'base-x'
import dayjs from 'dayjs'

class StorageManager {
  private static _instance: StorageManager | null = null
  private static readonly URLfriendlyEncoding = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  private storage = new Map<string, ShortenedURLEntry>()
  private descOrderedExpiryIndex: string[] = []
  
  private constructor() {}

  // Ensure a single instance of StorageManager
  static get instance(): StorageManager {
    if (StorageManager._instance === null) {
      StorageManager._instance = new StorageManager()
    }
    return StorageManager._instance
  }
  
  // SECURITY: in case of astronomically improbable collision, have a robust way to prevent sequential guesses
  hash(longURL: string, time: string) {
    for (let salt = 0; salt < 10; salt++) {
      const input = `${salt}::${time}::${longURL}`
      const binHash = createHash('sha256').update(input).digest()
      const base62 = baseX(StorageManager.URLfriendlyEncoding)
      const base62Hash = base62.encode(binHash)
      const hashSlice = base62Hash.slice(0, 8)

      if (this.storage.has(hashSlice)) continue // collision guard
      
      return hashSlice
    }
    throw new Error('Failed to generate a unique hash')
  }

  insert(safeShortenedURLEntry: ShortenedURLEntry) {
    const safeParam = safeShortenedURLEntry.shortParam
    this.storage.set(safeParam, safeShortenedURLEntry)
    this.descOrderedExpiryIndex.push(safeShortenedURLEntry.expiresAt.toISOString())
    this.descOrderedExpiryIndex.sort((a, b) => dayjs(b).diff(dayjs(a)))
  }

  read(shortParam: string): Readonly<ShortenedURLEntry> | undefined {
    return this.storage.get(shortParam)
  }

  incrementClicks(shortParam: string) {
    const entry = this.storage.get(shortParam)
    if (entry) entry.clicks++
  }

  buildShortURL(shortParam: string) {
    return `${env.PROTOCOL}://${env.DOMAIN}/${shortParam}`
  }

  extractShortParam(url: string) {
    const urlObj = new URL(url)
    return urlObj.pathname.slice(1)
  }

  get size() {
    return this.storage.size
  }
}

export { StorageManager }
