import { RouteHandler } from 'fastify'
import { URLEncodeSchema, URLFollowSchema } from '../schemas/url.schema'
import { z } from 'zod'
import dayjs from 'dayjs'
import { URLRepo } from '../repos/url.repo'
import type { ShortenedURLEntry } from '../types/storage.type'
import { env } from '../env'

const URLEncodeHandler: RouteHandler<{
  Body: z.infer<typeof URLEncodeSchema.body>,
  Reply: z.infer<typeof URLEncodeSchema.response[200]>
}> = (req) => {
  const { url, daysToExpire } = req.body
  const now = dayjs()
  const safeParam = URLRepo.instance.hash(url, now.toISOString())
  const shortenedURLEntry: ShortenedURLEntry = {
    createdAt: now.toDate(),
    expiresAt: now.add(daysToExpire ?? env.DEFAULT_EXPIRY_DAYS, 'days').toDate(),
    longURL: url,
    shortParam: safeParam,
    clicks: 0,
  }
  URLRepo.instance.insert(shortenedURLEntry)

  return { shortURL: URLRepo.instance.buildShortURL(safeParam) }
}

const URLFollowHandler: RouteHandler<{
  Params: z.infer<typeof URLFollowSchema.params>,
  Reply:
    | z.infer<typeof URLFollowSchema.response[302]>
    | z.infer<typeof URLFollowSchema.response[404]>
}> = (req, res) => {
  const { shortParam } = req.params
  const entry = URLRepo.instance.read(shortParam)
  if (!entry) {
    res.status(404)
    return {
      statusCode: 404,
      error: 'Not Found',
      message: 'Long URL not found',
    }
  }
  URLRepo.instance.incrementClicks(shortParam)

  res.status(302)
  res.redirect(entry.longURL)
  return
}

export { URLEncodeHandler, URLFollowHandler }
