import { RouteHandler } from 'fastify'
import { URLDecodeSchema, URLEncodeSchema, URLFollowSchema } from '../schemas/url.schema'
import { z } from 'zod'
import type { URLService } from '../services/url.service'

const buildURLEncodeHandler = (urlService: URLService): RouteHandler<{
  Body: z.infer<typeof URLEncodeSchema.body>
  Reply: z.infer<typeof URLEncodeSchema.response[200]>
}> => (req) => {
  const { longURL, daysToExpire } = req.body
  const shortURL = urlService.createShortURL(longURL, daysToExpire)

  return { shortURL }
}

const buildURLDecodeHandler = (urlService: URLService): RouteHandler<{
  Body: z.infer<typeof URLDecodeSchema.body>
  Reply:
    | z.infer<typeof URLDecodeSchema.response[200]>
    | z.infer<typeof URLDecodeSchema.response[404]>
}> => (req, res) => {
  const { shortURL } = req.body
  const longURL = urlService.getLongURL(shortURL)
  if (longURL === null) {
    res.status(404)
    return {
      statusCode: 404,
      error: 'Not Found',
      message: 'Short URL not found',
    }
  }
  return { longURL }
}

const buildURLFollowHandler = (urlService: URLService): RouteHandler<{
  Params: z.infer<typeof URLFollowSchema.params>,
  Reply:
    | z.infer<typeof URLFollowSchema.response[302]>
    | z.infer<typeof URLFollowSchema.response[404]>
}> => (req, res) => {
  const { shortParam } = req.params
  const longURL = urlService.getLongURLToFollow(shortParam)
  
  if (longURL === null) {
    res.status(404)
    return {
      statusCode: 404,
      error: 'Not Found',
      message: 'Long URL not found',
    }
  }

  res.status(302)
  res.redirect(longURL)
  return
}

export { buildURLEncodeHandler,buildURLDecodeHandler, buildURLFollowHandler }
