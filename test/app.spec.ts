import { test } from 'tap'
import { buildFastify} from '../src/app'

test('GET /health endpoint returns 200 and ok status in JSON format', async (t) => {
  t.teardown(() => app.close())
  t.plan(2)
  const app = buildFastify()

  const res = await app.inject({
    method: 'GET',
    url: '/health',
  }).catch((err) => {
    t.error(err)
  })
  if (!res) return

  t.equal(res?.statusCode, 200)
  t.equal(res?.body, JSON.stringify({ status: 'ok'}))
})
