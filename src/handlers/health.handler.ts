import type { RouteHandler } from 'fastify'
import type { HealthSchema } from '../schemas/health.schema'
import type { z } from 'zod'

const healthHandler: RouteHandler<{
  Querystring: z.infer<typeof HealthSchema.querystring>,
  Reply: z.infer<typeof HealthSchema.response[200]>
}> = () => {
  return { status: 'ok' }
}

export { healthHandler }
