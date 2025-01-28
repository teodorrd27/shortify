import type { ISchema } from '../types/schema.type'

import { z } from 'zod'
import validator from 'validator'
import { env } from '../env'

const URLEncodeSchema = {
  body: z.strictObject({
    longURL: z.string({
      required_error: `'longURL' omitted from body.`,
    }).refine((url) => {
      // ASSUMPTION: if provided URL does not have a protocol, it is defaulted to HTTPS
      return validator.isURL(url, { protocols: ['https'] })
    }, {
      message: 'Invalid URL. Hint: Make sure to use the HTTPS protocol.',
    }).transform((url) => {
      // DEFAULT: https:// preemption in case PROTOCOL is missing
      if (!url.startsWith('https://')) {
        return `https://${url}`
      }
      return url
    }),
    daysToExpire: z.number().optional(),
  }),
  response: {
    200: z.object({
      shortURL: z.string(),
    })
  }
} satisfies ISchema

const URLDecodeSchema = {
  body: z.strictObject({
    shortURL: z.string({
      required_error: `'shortURL' omitted from body.`,
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
      message: `Invalid URL. Hint: Make sure to use a ${env.PROTOCOL}://${env.DOMAIN}/{shortParam} link.`
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

const URLFollowSchema = {
  params: z.strictObject({
    shortParam: z.string().length(8),
  }, {
    message: `Your URL code must contain exactly 8 characters. Example: ${env.DOMAIN}/HPxdBt3e`,
  }),
  response: {
    302: z.void(),
    404: z.object({
      statusCode: z.number(),
      error: z.string(),
      message: z.string(),
    }),
  }
} satisfies ISchema

export { URLEncodeSchema, URLDecodeSchema, URLFollowSchema }
