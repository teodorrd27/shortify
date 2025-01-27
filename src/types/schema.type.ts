import type { z } from 'zod'

interface ISchema {
  body?: z.ZodType
  querystring?: z.ZodType
  params?: z.ZodType
  response: Record<number, z.ZodType>
}

export { ISchema }
