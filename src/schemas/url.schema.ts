import type { ISchema } from '../types/schema.type'

import { z } from 'zod'
import validator from 'validator'

const URLEncodeSchema = {
  body: z.strictObject({
    url: z.string({
      required_error: `'url' omitted from body.`,
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

const URLFollowSchema = {
  params: z.strictObject({
    shortParam: z.string().length(8),
  }, {
    message: `Your URL code must contain exactly 8 characters. Example: ${process.env.DOMAIN}/HPxdBt3e`,
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

export { URLEncodeSchema, URLFollowSchema }
