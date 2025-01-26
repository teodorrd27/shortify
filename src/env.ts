import { z } from 'zod'
import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Define the schema for your environment variables
const envSchema = z.object({
  PORT: z.string().transform(Number),
  HOST: z.string(),
  DOMAIN: z.string(),
  PROTOCOL: z.string(),
  DEFAULT_EXPIRY_DAYS: z.string().transform(Number),
})

type EnvType = z.infer<typeof envSchema>

// Validate and transform the environment variables
function validateEnv(): EnvType {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format())
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

export const env = validateEnv() 
export { validateEnv }
