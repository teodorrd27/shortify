import Fastify from 'fastify'
import { buildFastify } from './app'
import { env } from './env'

(async () => {
  const preConfiguredFastify = Fastify({
    logger: true,
  })
  await preConfiguredFastify.register(import('@fastify/rate-limit'), {
    global: true,
    max: 1000,
    timeWindow: 1000,
  })

  const app = buildFastify(preConfiguredFastify)

  app.listen({ port: env.PORT, host: env.HOST }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`Server running on ${address}`)
  });
})()
