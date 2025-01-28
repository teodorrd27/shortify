import { test } from 'tap'
import { buildFastify } from '../../src/app'
import { URLRepo } from '../../src/repos/url.repo'

test('system handles high load and maintains functionality', async (t) => {
  t.plan(4)

  const app = buildFastify()
  
  t.teardown(async () => {
    await app.close()
    URLRepo.instance.drop()
  })

  await app.ready()
  let rescounter = 0

  // Create many concurrent requests
  const numRequests = 1000
  const longURL = 'https://example.com/test'
  const requests = Array(numRequests).fill(null).map(() => 
    app.inject({
      method: 'POST',
      url: '/encode',
      payload: {
        longURL
      }
    })
  )

  // Execute all requests concurrently
  const responses = await Promise.all(requests)

  // Verify all requests succeeded
  const successfulResponses = responses.filter(r => r.statusCode === 200)
  t.equal(successfulResponses.length, numRequests, 'All concurrent requests succeeded')

  // Pick a random shortURL from responses to verify system still works
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  const shortURL = randomResponse.json().shortURL

  // Verify URL redirection still works
  const followResponse = await app.inject({
    method: 'GET',
    url: shortURL
  })
  t.equal(followResponse.statusCode, 302, 'URL redirection works after load test')
  t.equal(followResponse.headers.location, longURL, 'Redirects to correct destination')

  // Verify URL decoding still works
  const decodeResponse = await app.inject({
    method: 'POST',
    url: '/decode',
    payload: {
      shortURL
    }
  })
  t.equal(decodeResponse.json().longURL, longURL, 'URL decoding works after load test')
})
