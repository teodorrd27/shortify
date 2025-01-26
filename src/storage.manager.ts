import { env } from './env'
import { ShortenedURLEntry } from './types/storage.type'
import { createHash } from 'crypto'
import baseX from 'base-x'

class StorageManager {
  private static _instance: StorageManager | null = null
  private static readonly URLfriendlyEncoding = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  
  private constructor(
    public storage = new Map<string, ShortenedURLEntry>(),
    public descOrderedExpiryIndex: string[] = []
  ) {}

  // SECURITY: Return a non modifiable shallow read-only instance of StorageManager
  public static get instance(): StorageManager {
    if (StorageManager._instance === null) {
      StorageManager._instance = new StorageManager()
    }
    return Object.freeze(StorageManager._instance)
  }
  
  // SECURITY: in case of astronomically improbable collision, have a robust way to prevent sequential guesses
  public hash(longURL: string, time: string) {
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

  public buildShortURL(shortParam: string) {
    return `${env.PROTOCOL}://${env.DOMAIN}/${shortParam}`
  }

  public extractShortParam(url: string) {
    const urlObj = new URL(url)
    return urlObj.pathname.slice(1)
  }
}

export { StorageManager }
