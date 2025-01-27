import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { URLRepo } from './repos/url.repo'

import { fastifySchedule } from '@fastify/schedule'

import { cleanupExpiredURLsJob } from './jobs/cleanupExpiredURLs.job'
import { healthHandler } from './handlers/health.handler'
import { DemoURLDecodeSchema, DemoURLEncodeSchema } from './schemas/demo.url.schema'
import { DemoURLDecodeHandler, DemoURLEncodeHandler } from './handlers/demo.url.handler'
import { HealthSchema } from './schemas/health.schema'
import { URLEncodeSchema, URLFollowSchema } from './schemas/url.schema'
import { URLEncodeHandler, URLFollowHandler } from './handlers/url.handler'

const buildFastify = () => {
  const fastify = Fastify({
    logger: true,
  })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.register(fastifySchedule)

  // SECURITY: custom handler prevents sensitive Fastify information from being exposed
  // TODO: move to separate module
  fastify.setErrorHandler((error, req, res) => {
    console.log(req.params)
    // TODO: must improve message format
    return res
      .status(error.statusCode || 400)
      .send({
        statusCode: error.statusCode || 400,
        error: 'Bad Request',
        message: error.message,
      })
  })

  // PROD Handlers
  fastify.withTypeProvider<ZodTypeProvider>().get('/health', { schema: HealthSchema }, healthHandler)
  fastify.withTypeProvider<ZodTypeProvider>().post('/encode', { schema: URLEncodeSchema }, URLEncodeHandler)
  fastify.withTypeProvider<ZodTypeProvider>().get('/:shortParam', { schema: URLFollowSchema }, URLFollowHandler)

  // DEMO Handlers (Try in browser)
  fastify.withTypeProvider<ZodTypeProvider>().get('/encode', { schema: DemoURLEncodeSchema }, DemoURLEncodeHandler)
  fastify.withTypeProvider<ZodTypeProvider>().get('/decode', { schema: DemoURLDecodeSchema }, DemoURLDecodeHandler)

  fastify.ready().then(() => {
    fastify.scheduler.addSimpleIntervalJob(cleanupExpiredURLsJob)
  })

  return fastify
}

export { buildFastify }
