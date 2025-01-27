import type { RouteHandler } from 'fastify'
import type { DemoURLDecodeSchema, DemoURLEncodeSchema } from '../schemas/demo.url.schema'
import type { ShortenedURLEntry } from '../types/storage.type'

import dayjs from 'dayjs'
import { env } from '../env'
import { URLRepo } from '../repos/url.repo'
import { z } from 'zod'

const DemoURLEncodeHandler: RouteHandler<{
  Querystring: z.infer<typeof DemoURLEncodeSchema.querystring>
  Reply: z.infer<typeof DemoURLEncodeSchema.response[200]>
}> = async (req) => {
  const { url } = req.query
  const now = dayjs()
  const safeParam = URLRepo.instance.hash(url, now.toISOString())
  const shortenedURLEntry: ShortenedURLEntry = {
    createdAt: now.toDate(),
    expiresAt: now.add(env.DEFAULT_EXPIRY_DAYS, 'days').toDate(),
    longURL: url,
    shortParam: safeParam,
    clicks: 0,
  }
  URLRepo.instance.insert(shortenedURLEntry)

  return { shortURL: URLRepo.instance.buildShortURL(safeParam) }
}

const DemoURLDecodeHandler: RouteHandler<{
  Querystring: z.infer<typeof DemoURLDecodeSchema.querystring>
  Reply:
    | z.infer<typeof DemoURLDecodeSchema.response[200]>
    | z.infer<typeof DemoURLDecodeSchema.response[404]>
}> = (req, res) => {
  const { url } = req.query
  const shortParam = URLRepo.instance.extractShortParam(url)
  const entry = URLRepo.instance.read(shortParam)

  if (!entry) {
    res.status(404)
    return {
      statusCode: 404,
      error: 'Not Found',
      message: 'Short URL not found',
    }
  }
  return { longURL: entry.longURL }
}

export { DemoURLEncodeHandler, DemoURLDecodeHandler }
