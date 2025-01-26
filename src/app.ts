import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import validator from 'validator'
import { StorageManager } from './storage.manager'
import dayjs from 'dayjs'
import { env } from './env'

import { fastifySchedule } from '@fastify/schedule'
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler'

const cleanupExpiredURLsTask = new AsyncTask('clean up expired URLs', async () => {
  const now = dayjs()
  let descOrderedExpiryIndex = StorageManager.instance.descOrderedExpiryIndex
  while (descOrderedExpiryIndex.length > 0 && now.isAfter(dayjs(descOrderedExpiryIndex[descOrderedExpiryIndex.length - 1]))) {
    const expiredEntry = descOrderedExpiryIndex.pop()!
    StorageManager.instance.storage.delete(expiredEntry)
  }
})
const cleanupExpiredURLsJob = new SimpleIntervalJob({ seconds: 1 }, cleanupExpiredURLsTask)

const buildFastify = () => {
  const fastify = Fastify({
    logger: true,
  })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.register(fastifySchedule)

  // SECURITY: custom handler prevents sensitive Fastify information from being exposed
  // TODO: move to separate module
  fastify.setErrorHandler((error, req, reply) => {
    console.log(req.params)
    // TODO: must improve message format
    if (error) {
      return reply
        .status(error.statusCode || 400)
        .send({
          statusCode: error.statusCode || 400,
          error: 'Bad Request',
          message: error.message,
        })
    }
    return reply.send(error)
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/health', { 
    schema: {
      querystring: z.strictObject({}),
      response: {
        200: z.object({
          status: z.string(),
        }),
      }
    }}, () => {
      return { status: 'ok'}
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/encode', { schema: {
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
  } }, (req, res) => {
    const { url } = req.query
    const now = dayjs()
    const safeParam = StorageManager.instance.hash(url, now.toISOString())
    StorageManager.instance.storage.set(safeParam, {
      createdAt: now.toDate(),
      expiresAt: now.add(env.DEFAULT_EXPIRY_DAYS, 'days').toDate(),
      longURL: url,
      shortParam: safeParam,
      clicks: 0,
    })

    return { shortURL: StorageManager.instance.buildShortURL(safeParam) }
  })

  fastify.withTypeProvider<ZodTypeProvider>().post('/encode', { schema: {
    body: z.strictObject({
      url: z.string({
        required_error: `'url' omitted from body.`,
      }).refine((url) => {
        // ASSUMPTION: if provided URL does not have a protocol, it is defaulted to HTTPS
        return validator.isURL(url, { protocols: ['https'] })
      }, {
        message: 'Invalid URL. Hint: Make sure to use the HTTPS protocol. For URLs with query parameters, use POST endpoint instead',
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
  }}, (req, res) => {
    const { url, daysToExpire } = req.body
    const now = dayjs()
    const safeParam = StorageManager.instance.hash(url, now.toISOString())
    StorageManager.instance.storage.set(safeParam, {
      createdAt: now.toDate(),
      expiresAt: now.add(daysToExpire ?? env.DEFAULT_EXPIRY_DAYS, 'days').toDate(),
      longURL: url,
      shortParam: safeParam,
      clicks: 0,
    })

    return { shortURL: StorageManager.instance.buildShortURL(safeParam) }
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/decode', { schema: {
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
  } }, (req, res) => {
    const { url } = req.query
    const shortParam = StorageManager.instance.extractShortParam(url)
    const entry = StorageManager.instance.storage.get(shortParam)

    if (!entry) {
      res.status(404)
      return {
        statusCode: 404,
        error: 'Not Found',
        message: 'Short URL not found',
      }
    }
    return { longURL: entry.longURL }
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/:shortParam', { schema: {
    params: z.strictObject({
      shortParam: z.string().length(8),
    }, {
      message: `Your URL code must contain exactly 8 characters. Example: ${process.env.DOMAIN}/HPxdBt3e`,
    }),
    response: {
      404: z.object({
        statusCode: z.number(),
        error: z.string(),
        message: z.string(),
      }),
      302: z.void(),
    }
  } }, (req, res) => {
    const { shortParam } = req.params
    const entry = StorageManager.instance.storage.get(shortParam)
    if (!entry) {
      res.status(404)
      return {
        statusCode: 404,
        error: 'Not Found',
        message: 'Long URL not found',
      }
    }
    entry.clicks++

    res.status(302)
    res.redirect(entry.longURL)
    return
  })

  fastify.ready().then(() => {
    fastify.scheduler.addSimpleIntervalJob(cleanupExpiredURLsJob)
  })

  return fastify
}

export { buildFastify }
