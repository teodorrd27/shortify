import { test } from 'tap'
import { buildFastify } from '../../src/app'
import { URLRepo } from '../../src/repos/url.repo'

test('URL lifecycle through API', async (t) => {
  t.plan(6)
  const app = buildFastify()
  t.teardown(async () => {
    await app.close()
    URLRepo.instance.drop()
  })

  await app.ready()

  const longURL = 'https://example.com/very/long/url'
  
  // Create short URL
  const encodeResponse = await app.inject({
    method: 'POST',
    url: '/encode',
    payload: {
      longURL
    }
  })
  t.equal(encodeResponse.statusCode, 200)
  const shortURL = encodeResponse.json().shortURL
  
  // Follow short URL
  const followResponse = await app.inject({
    method: 'GET',
    url: shortURL
  })
  t.equal(followResponse.statusCode, 302)
  t.equal(followResponse.headers.location, longURL)

  // Decode short URL
  const decodeResponse = await app.inject({
    method: 'POST',
    url: '/decode',
    payload: {
      shortURL
    }
  })
  t.equal(decodeResponse.statusCode, 200)
  t.equal(decodeResponse.json().longURL, longURL)

  // Check click count - Use URLRepo directly to verify click count is correct
  const urlRepo = URLRepo.instance
  const shortParam = urlRepo.extractShortParam(shortURL)
  const entry = urlRepo.read(shortParam)
  t.equal(entry?.clicks, 1)
})
