import { test } from 'tap'
import { buildFastify } from '../../src/app'
import Fastify from 'fastify'

test('rate limiter prevents excessive requests', async (t) => {
  t.plan(4)
  const preconfiguredFastify = Fastify({
    logger: false
  })
  await preconfiguredFastify.register(import('@fastify/rate-limit'), {
    global: true,
    max: 101, // 1 initial, 100 extra
    timeWindow: 1000 // within 1 second
  })
  const app = buildFastify(preconfiguredFastify)
  
  t.teardown(async () => {
    await app.close()
  })

  await app.ready()

  // First request should succeed
  const firstResponse = await app.inject({
    method: 'GET',
    url: '/health'
  })
  t.equal(firstResponse.statusCode, 200, 'First request succeeds')

  // Make many rapid requests
  const requests: Promise<import('light-my-request').Response>[] = []
  let count = 0
  while (count < 200) { // orchestrate 200 requests with 2 ms space between each
    await new Promise(resolve => setTimeout(resolve, 2))
    const injection = app.inject({
      method: 'GET',
      url: '/health'
    })
    requests.push(injection)
    count++
  }

  const responses = await Promise.all(requests)

  // Some requests should be rate limited
  const rateLimitedResponses = responses.filter(r => r.statusCode === 429)
  t.equal(rateLimitedResponses.length, 100, 'Exactly 100 requests were rate limited')

  // Verify rate limit response
  const limitedResponse = rateLimitedResponses[0]
  t.equal(limitedResponse.statusCode, 429, 'Rate limited requests return 429')
  t.match(limitedResponse.json().message, /rate limit exceeded/i, 'Rate limit message is returned')
})
