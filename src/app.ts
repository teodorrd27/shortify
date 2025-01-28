import Fastify, { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'

import { fastifyHelmet } from '@fastify/helmet'
import { fastifySchedule } from '@fastify/schedule'

import { cleanupExpiredURLsJob } from './jobs/cleanupExpiredURLs.job'
import { healthHandler } from './handlers/health.handler'
import { DemoURLDecodeSchema, DemoURLEncodeSchema } from './schemas/demo.url.schema'
import { buildDemoURLDecodeHandler, buildDemoURLEncodeHandler } from './handlers/demo.url.handler'
import { HealthSchema } from './schemas/health.schema'
import { URLDecodeSchema, URLEncodeSchema, URLFollowSchema } from './schemas/url.schema'
import { buildURLDecodeHandler, buildURLEncodeHandler, buildURLFollowHandler } from './handlers/url.handler'
import { URLRepo } from './repos/url.repo'
import { URLService } from './services/url.service'

const buildFastify = (preConfiguredFastifyInstance?: FastifyInstance) => {
  const fastify = preConfiguredFastifyInstance || Fastify()

  const urlService = new URLService(URLRepo.instance)

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.register(fastifyHelmet)
  fastify.register(fastifySchedule)

  // SECURITY: custom handler prevents sensitive Fastify information from being exposed
  // TODO: move to separate module
  fastify.setErrorHandler((error, req, res) => {
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
  fastify.withTypeProvider<ZodTypeProvider>().post('/encode', { schema: URLEncodeSchema }, buildURLEncodeHandler(urlService))
  fastify.withTypeProvider<ZodTypeProvider>().post('/decode', { schema: URLDecodeSchema }, buildURLDecodeHandler(urlService))
  fastify.withTypeProvider<ZodTypeProvider>().get('/:shortParam', { schema: URLFollowSchema }, buildURLFollowHandler(urlService))

  // DEMO Handlers (Try in browser)
  fastify.withTypeProvider<ZodTypeProvider>().get('/encode', { schema: DemoURLEncodeSchema }, buildDemoURLEncodeHandler(urlService))
  fastify.withTypeProvider<ZodTypeProvider>().get('/decode', { schema: DemoURLDecodeSchema }, buildDemoURLDecodeHandler(urlService))

  fastify.ready().then(() => {
    fastify.scheduler.addSimpleIntervalJob(cleanupExpiredURLsJob)
  })

  return fastify
}

export { buildFastify }
