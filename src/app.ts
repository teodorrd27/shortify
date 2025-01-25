import Fastify from 'fastify'
import { validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import validator from 'validator'
import { StorageManager } from './storage.manager'

const buildFastify = () => {
  const fastify = Fastify({
    logger: true,
  })

  fastify.setValidatorCompiler(validatorCompiler)

  // SECURITY: custom handler prevents sensitive Fastify information from being exposed
  // TODO: move to separate module
  fastify.setErrorHandler((error, _, reply) => {
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

  fastify.get('/health', { schema: { querystring: z.strictObject({}) }}, (_, res) => {
    const payload = {
      status: 'ok',
    }
    res.send(payload)
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/encode', { schema: {
    querystring: z.strictObject({
      url: z.string({
        required_error: `'url' query is required. Example: ${process.env.DOMAIN}/encode?url=https://example.com`,
      }).refine((url) => {
        return validator.isURL(url, { protocols: ['https'], allow_query_components: false })
      }, {
        message: 'Invalid URL. Hint: Make sure to use the HTTPS protocol. For URLs with query parameters, use POST endpoint instead',
      }),
    }),
  } }, (req, res) => {
    res.send(req.query)
  })

  return fastify
}

export { buildFastify }
