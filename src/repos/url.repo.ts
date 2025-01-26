import { env } from '../env'
import { ShortenedURLEntry } from '../types/storage.type'
import { createHash } from 'crypto'
import baseX from 'base-x'
import dayjs, { Dayjs } from 'dayjs'

class URLRepo {
  private static _instance: URLRepo | null = null
  private static readonly URLfriendlyEncoding = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  private constructor(
    private storage = new Map<string, ShortenedURLEntry>(),
    private descOrderedExpiryIndex: string[] = [],
  ) {}

  // Ensure a single instance of URLRepo
  // SECURITY: prevent modification of the instance
  static get instance() {
    if (URLRepo._instance === null) {
      URLRepo._instance = new URLRepo()
    }
    return Object.freeze(URLRepo._instance)
  }

  // SECURITY: in case of astronomically improbable collision, have a robust way to prevent sequential guesses
  hash(longURL: string, time: string) {
    for (let salt = 0; salt < 10; salt++) {
      const input = `${salt}::${time}::${longURL}`
      const binHash = createHash('sha256').update(input).digest()
      const base62 = baseX(URLRepo.URLfriendlyEncoding)
      const base62Hash = base62.encode(binHash)
      const hashSlice = base62Hash.slice(0, 8)

      if (this.storage.has(hashSlice)) continue // collision guard
      
      return hashSlice
    }
    throw new Error('Failed to generate a unique hash')
  }

  insert(safeShortenedURLEntry: ShortenedURLEntry) {
    const safeParam = safeShortenedURLEntry.shortParam
    const expiresAt = safeShortenedURLEntry.expiresAt.toISOString()
    this.storage.set(safeParam, safeShortenedURLEntry)
    this.storage.set(expiresAt, safeShortenedURLEntry)
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

  isLastOrderedEntryExpired(dateTimeNow: Dayjs) {
    const length = this.descOrderedExpiryIndex.length
    return length > 0 && dateTimeNow.isAfter(dayjs(this.descOrderedExpiryIndex[length - 1]))
  }

  deleteLastEntry() {
    const key = this.descOrderedExpiryIndex.pop()
    if (key) {
      const entry = this.storage.get(key)
      if (entry) {
        this.storage.delete(entry.shortParam)
        this.storage.delete(entry.expiresAt.toISOString())
      }
    }
  }

  get size() {
    return this.storage.size / 2
  }

  drop() {
    this.storage.clear()
    this.descOrderedExpiryIndex.length = 0
  }
}

export { URLRepo }
