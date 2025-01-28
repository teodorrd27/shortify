import { URLRepo } from '../repos/url.repo'
import { ShortenedURLEntry } from '../types/storage.type'
import { env } from '../env'
import dayjs from 'dayjs'

export class URLService {
  constructor(private readonly urlRepo = URLRepo.instance) {}

  createShortURL(longURL: string, daysToExpire?: number): string {
    const now = dayjs()
    const safeParam = this.urlRepo.hash(longURL, now.toISOString())
    
    const shortenedURLEntry: ShortenedURLEntry = {
      createdAt: now.toDate(),
      expiresAt: now.add((daysToExpire ?? env.DEFAULT_EXPIRY_DAYS) * 24, 'hours').toDate(),
      longURL,
      shortParam: safeParam,
      clicks: 0,
    }
    
    this.urlRepo.insert(shortenedURLEntry)
    return this.urlRepo.buildShortURL(safeParam)
  }

  getLongURLToFollow(shortParam: string): string | null {
    const entry = this.urlRepo.read(shortParam)
    if (!entry) return null
    
    this.urlRepo.incrementClicks(shortParam)
    return entry.longURL
  }

  getLongURL(url: string): string | null {
    const shortParam = this.urlRepo.extractShortParam(url)
    const entry = this.urlRepo.read(shortParam)
    
    if (!entry) return null
    return entry.longURL
  }
} 
