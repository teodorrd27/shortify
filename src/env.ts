import { z } from 'zod'
import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Override .env with command line arguments if provided
// API_LOGGING can be overridden via environment variable
// e.g. API_LOGGING=false npm run dev
if (process.env.API_LOGGING) {
  process.env.API_LOGGING = process.env.API_LOGGING.toLowerCase()
}

// Define the schema for your environment variables
const envSchema = z.object({
  PORT: z.string().transform(Number),
  HOST: z.string(),
  DOMAIN: z.string(),
  PROTOCOL: z.string(),
  DEFAULT_EXPIRY_DAYS: z.string().transform(Number),
  API_LOGGING: z.string()
  .refine((val) => ['true', 'false'].includes(val.toLowerCase()))
  .transform((val) => val.toLowerCase() === 'true')
})

type EnvType = z.infer<typeof envSchema>

// Validate and transform the environment variables
function validateEnv(): EnvType {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

export const env = validateEnv() 
export { validateEnv }
