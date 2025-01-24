import { buildFastify } from './app'

const app = buildFastify()
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`Server running on ${address}`)
})

export { app }
