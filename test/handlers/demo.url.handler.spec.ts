import { test } from 'tap'
import { buildFastify } from '../../src/app'
import { URLRepo } from '../../src/repos/url.repo'
import { env } from '../../src/env'
import dayjs from 'dayjs'

test('DemoURLEncodeHandler', async (t) => {

  t.test('successfully encodes a valid URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
    
    const testURL = 'https://example.com'
    const res = await app.inject({
      method: 'GET',
      url: '/encode',
      query: { longURL: testURL }
    })

    t.equal(res.statusCode, 200)
    const body = res.json()
    t.ok(body.shortURL)
    t.match(body.shortURL, new RegExp(`^${env.PROTOCOL}://${env.DOMAIN}`))
  })

  t.test('successfully encodes URL without protocol', async (t) => {
    t.teardown(() => app.close())
    t.plan(4)
    const app = buildFastify()
    
    const testURL = 'example.com'
    const res = await app.inject({
      method: 'GET',
      url: '/encode',
      query: { longURL: testURL }
    })

    t.equal(res.statusCode, 200)
    const body = res.json()
    t.ok(body.shortURL)
    t.match(body.shortURL, new RegExp(`^${env.PROTOCOL}://${env.DOMAIN}`))
    
    // Verify the stored long URL has https:// prefix
    const shortParam = body.shortURL.split('/').pop()
    const storedURL = URLRepo.instance.read(shortParam)
    t.equal(storedURL?.longURL, 'https://example.com')
  })

  t.test('returns 400 for invalid URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
    
    const res = await app.inject({
      method: 'GET',
      url: '/encode',
      query: { longURL: 'not-a-valid-url' }
    })

    t.equal(res.statusCode, 400)
    const body = res.json()
    t.equal(body.error, 'Bad Request')
    t.ok(body.message)
  })

  test('Error handler returns 400 status code and error message for invalid requests', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
  
    const res = await app.inject({
      method: 'GET',
      url: '/encode',
      query: {
        longURL: 'invalid-url'
      }
    }).catch((err) => {
      t.error(err)
    })
    if (!res) return
  
    t.equal(res.statusCode, 400)
    t.equal(res.json().error, 'Bad Request')
    t.ok(res.json().message)
  })
})

test('DemoURLDecodeHandler', async (t) => {
  t.test('successfully decodes an existing short URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(2)
    const app = buildFastify()

    // Create a test URL entry
    const longURL = 'https://example.com'
    const now = dayjs()
    const shortParam = URLRepo.instance.hash(longURL, now.toISOString())
    URLRepo.instance.insert({
      longURL,
      shortParam,
      createdAt: now.toDate(),
      expiresAt: now.add(env.DEFAULT_EXPIRY_DAYS, 'days').toDate(),
      clicks: 0
    })

    const shortURL = URLRepo.instance.buildShortURL(shortParam)
    const res = await app.inject({
      method: 'GET',
      url: '/decode',
      query: { shortURL: shortURL }
    })

    t.equal(res.statusCode, 200)
    t.equal(res.json().longURL, longURL)
  })

  t.test('returns 404 for non-existent short URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
    
    const nonExistentURL = `${env.DOMAIN}/nonexistent`
    const res = await app.inject({
      method: 'GET',
      url: '/decode',
      query: { shortURL: nonExistentURL }
    })

    t.equal(res.statusCode, 404)
    const body = res.json()
    t.equal(body.error, 'Not Found')
    t.equal(body.message, 'Short URL not found')
  })

  t.test('returns 400 for invalid short URL format', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
    
    const res = await app.inject({
      method: 'GET',
      url: '/decode',
      query: { shortURL: 'invalid-url' }
    })

    t.equal(res.statusCode, 400)
    const body = res.json()
    t.equal(body.error, 'Bad Request')
    t.ok(body.message)
  })
})
