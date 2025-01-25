interface ShortenedURLEntry {
  longURL: string
  shortParam: string
  createdAt: Date
  expiresAt: Date
}

type LooseISODateString = `${string}T${string}Z`

export { ShortenedURLEntry, LooseISODateString }
