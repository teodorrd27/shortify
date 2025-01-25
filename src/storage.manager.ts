import { ShortenedURLEntry, LooseISODateString } from './types/storage.type'

class StorageManager {
  private static _instance: StorageManager | null = null
  
  private constructor(
    public storage = new Map<string, ShortenedURLEntry>(),
    public orderedExpiryIndex: LooseISODateString[] = []
  ) {}

  // SECURITY: Return a non modifiable shallow read-only instance of StorageManager
  public static get instance(): StorageManager {
    if (StorageManager._instance === null) {
      StorageManager._instance = new StorageManager()
    }
    return Object.freeze(StorageManager._instance)
  }
  
  public buildShortURL(shortParam: string) {
    return `https://${process.env.DOMAIN}/${shortParam}`
  }
}

export { StorageManager }
