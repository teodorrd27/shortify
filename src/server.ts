import { buildFastify } from './app'

const app = buildFastify()
app.listen({ port: parseInt(process.env.PORT ?? '3000'), host: process.env.HOST }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`Server running on ${address}`)
})

export { app }
