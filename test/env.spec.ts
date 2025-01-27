import { test } from 'tap'
import { validateEnv } from '../src/env'

test('env: throws if all required variables are not set', async (t) => {
  t.plan(1)
  delete process.env.PORT
  t.throws(() => validateEnv(), 'Invalid environment variables')
})
