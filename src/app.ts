import Fastify from 'fastify'

const buildFastify = () => {
  const fastify = Fastify({
    logger: true,
  })

  fastify.get('/health', (req, res) => {
    res.send(JSON.stringify({
      status: 'ok',
    }))
  })

  return fastify
}

export { buildFastify }
