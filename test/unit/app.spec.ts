import { test } from 'tap'
import { buildFastify } from '../../src/app'

test('Error handler returns 400 status code when error has no status code', async (t) => {
  t.teardown(() => app.close())
  t.plan(3)
  const app = buildFastify()

  // Mock error without statusCode
  app.get('/test-error', () => {
    const error = new Error('Test error')
    throw error
  })

  const res = await app.inject({
    method: 'GET',
    url: '/test-error'
  }).catch((err) => {
    t.error(err)
  })
  if (!res) return

  t.equal(res.statusCode, 400)
  t.equal(res.json().error, 'Bad Request')
  t.equal(res.json().message, 'Test error')
})
