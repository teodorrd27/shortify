import type { ISchema } from '../types/schema.type'

import { z } from 'zod'

const HealthSchema = {
  querystring: z.strictObject({}),
  response: {
    200: z.strictObject({
      status: z.string(),
    })
  }
} satisfies ISchema

export { HealthSchema }
