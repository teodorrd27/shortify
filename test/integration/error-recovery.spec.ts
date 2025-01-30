import { test } from 'tap'
import { buildFastify } from '../../src/app'
import { URLRepo } from '../../src/repos/url.repo'

test('system recovers from errors and maintains data integrity', async (t) => {
  t.plan(9)
  const app = buildFastify()
  const urlRepo = URLRepo.instance
  
  t.teardown(async () => {
    await app.close()
    URLRepo.instance.drop()
  })

  await app.ready()

  const longURL = 'https://example.com/test'

  // Create initial short URL successfully
  const createResponse = await app.inject({
    method: 'POST',
    url: '/encode',
    payload: {
      longURL
    }
  })
  t.equal(createResponse.statusCode, 200, 'Initial URL creation succeeds')
  const shortURL = createResponse.json().shortURL

  // Force error by corrupting data
  const shortParam = urlRepo.extractShortParam(shortURL)
  const originalEntry = urlRepo.read(shortParam)
  t.ok(originalEntry, 'Original URL entry exists before data loss')
  urlRepo.drop() // Simulate data loss

  // Attempt to access corrupted URL
  const failedFollowResponse = await app.inject({
    method: 'GET',
    url: shortURL
  })
  t.equal(failedFollowResponse.statusCode, 404, 'Returns 404 when URL not found')

  // System should allow recreation of URLs
  const recreateResponse = await app.inject({
    method: 'POST',
    url: '/encode',
    payload: {
      longURL
    }
  })
  t.equal(recreateResponse.statusCode, 200, 'Allows recreation after data loss')
  const newShortURL = recreateResponse.json().shortURL

  // Verify new URL works
  const followResponse = await app.inject({
    method: 'GET',
    url: newShortURL
  })
  t.equal(followResponse.statusCode, 302, 'New URL redirects correctly')
  t.equal(followResponse.headers.location, longURL, 'Redirects to correct destination')

  // Verify click tracking recovers
  const firstClick = await app.inject({
    method: 'GET',
    url: newShortURL
  })
  t.equal(firstClick.statusCode, 302, 'First click works')

  const secondClick = await app.inject({
    method: 'GET',
    url: newShortURL
  })
  t.equal(secondClick.statusCode, 302, 'Second click works')

  // Verify click count maintained correctly after recovery
  const newParam = urlRepo.extractShortParam(newShortURL)
  const newEntry = urlRepo.read(newParam)
  t.equal(newEntry?.clicks, 3, 'Click counting maintained after recovery')
})
