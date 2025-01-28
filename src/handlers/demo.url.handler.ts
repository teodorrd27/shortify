import type { RouteHandler } from 'fastify'
import type { DemoURLDecodeSchema, DemoURLEncodeSchema } from '../schemas/demo.url.schema'
import { z } from 'zod'
import type { URLService } from '../services/url.service'

const buildDemoURLEncodeHandler = (urlService: URLService): RouteHandler<{
  Querystring: z.infer<typeof DemoURLEncodeSchema.querystring>
  Reply: z.infer<typeof DemoURLEncodeSchema.response[200]>
}> => async (req) => {
  const { longURL } = req.query
  const shortURL = urlService.createShortURL(longURL)

  return { shortURL }
}

const buildDemoURLDecodeHandler = (urlService: URLService): RouteHandler<{
  Querystring: z.infer<typeof DemoURLDecodeSchema.querystring>
  Reply:
    | z.infer<typeof DemoURLDecodeSchema.response[200]>
    | z.infer<typeof DemoURLDecodeSchema.response[404]>
}> => (req, res) => {
  const { shortURL } = req.query
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

export { buildDemoURLEncodeHandler, buildDemoURLDecodeHandler }
