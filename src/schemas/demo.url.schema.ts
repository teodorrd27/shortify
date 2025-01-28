import type { ISchema } from '../types/schema.type'

import validator from 'validator'
import { z } from 'zod'
import { env } from '../env'

const DemoURLEncodeSchema = {
  querystring: z.strictObject({
    longURL: z.string({
      required_error: `'longURL' query is required. Example: ${env.DOMAIN}/encode?longURL=https://example.com`,
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
    shortURL: z.string({
      required_error: `'shortURL' query is required. Example: ${env.DOMAIN}/decode?shortURL=${env.PROTOCOL}://${env.DOMAIN}/HPxdBt3e`,
    }).refine((url) => {
      // ASSUMPTION: if provided URL does not have a protocol, it is defaulted to HTTPS
      const isValidURL = validator.isURL(url, {
        protocols: [env.PROTOCOL],
        require_port: env.PROTOCOL === 'http', // if running locally, port is required
        require_tld: env.PROTOCOL === 'https', // if running in prod, tld is required
        allow_query_components: false
      })
      return isValidURL
    }, {
      message: `Invalid URL. Hint: Make sure to use a ${env.PROTOCOL}://${env.DOMAIN}/{8-character-code} link.`
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
