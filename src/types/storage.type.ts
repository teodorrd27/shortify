interface ShortenedURLEntry {
  longURL: string
  shortParam: string
  createdAt: Date
  expiresAt: Date
  clicks: number
}

export { ShortenedURLEntry }
