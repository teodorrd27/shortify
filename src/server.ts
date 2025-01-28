import { buildFastify } from './app'
import { env } from './env'

const app = buildFastify()
app.listen({ port: env.PORT, host: env.HOST }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`Server running on ${address}`)
})

export { app }
