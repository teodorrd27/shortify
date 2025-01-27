import type { ISchema } from '../types/schema.type'

import validator from 'validator'
import { z } from 'zod'
import { env } from '../env'

const DemoURLEncodeSchema = {
  querystring: z.strictObject({
    url: z.string({
      required_error: `'url' query is required. Example: ${process.env.DOMAIN}/encode?url=https://example.com`,
    }).refine((url) => {
      // ASSUMPTION: if provided URL does not have a protocol, it is defaulted to HTTPS
      return validator.isURL(url, { protocols: ['https'], allow_query_components: false })
    }, {
      message: 'Invalid URL. Hint: Make sure to use the HTTPS protocol. For URLs with query parameters, use POST endpoint instead',
    }).transform((url) => {
      // DEFAULT: https:// preemption in case PROTOCOL is missing
      if (!url.startsWith('https://')) {
        return `https://${url}`
      }
      return url
    }),
  }),
  response: {
    200: z.object({
      shortURL: z.string(),
    }),
  }
} satisfies ISchema

const DemoURLDecodeSchema = {
  querystring: z.strictObject({
    url: z.string({
      required_error: `'url' query is required. Example: ${process.env.DOMAIN}/decode?url=${env.PROTOCOL}://${env.DOMAIN}/HPxdBt3e`,
    }).transform((url) => {
      if (!url.startsWith(`${env.PROTOCOL}://`)) {
        return `${env.PROTOCOL}://${url}`
      }
      return url
    }),
  }),
  response: {
    200: z.object({
      longURL: z.string(),
    }),
    404: z.object({
      statusCode: z.number(),
      error: z.string(),
      message: z.string(),
    }),
  }
} satisfies ISchema

export { DemoURLEncodeSchema, DemoURLDecodeSchema }
