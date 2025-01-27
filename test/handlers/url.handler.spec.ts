import { test } from 'tap'
import { buildFastify } from '../../src/app'
import { URLRepo } from '../../src/repos/url.repo'
import { env } from '../../src/env'
import dayjs from 'dayjs'

test('URLEncodeHandler', async (t) => {
  t.test('successfully encodes URL with default expiry', async (t) => {
    t.teardown(() => app.close())
    t.plan(4)
    const app = buildFastify()
    
    const testURL = 'https://example.com'
    const res = await app.inject({
      method: 'POST',
      url: '/encode',
      payload: { url: testURL }
    })

    t.equal(res.statusCode, 200)
    const body = res.json()
    t.ok(body.shortURL)
    t.match(body.shortURL, new RegExp(`^${env.PROTOCOL}://${env.DOMAIN}`))

    // Verify the URL was stored with correct expiry
    const shortParam = body.shortURL.split('/').pop()
    const storedURL = URLRepo.instance.read(shortParam)
    t.ok(
      dayjs(storedURL?.expiresAt).isSame(
        dayjs().add(env.DEFAULT_EXPIRY_DAYS, 'days'),
        'day'
      )
    )
  })

  t.test('successfully encodes URL with custom expiry', async (t) => {
    t.teardown(() => app.close())
    t.plan(4)
    const app = buildFastify()
    
    const testURL = 'https://example.com'
    const customDays = 5
    const res = await app.inject({
      method: 'POST',
      url: '/encode',
      payload: { 
        url: testURL,
        daysToExpire: customDays
      }
    })

    t.equal(res.statusCode, 200)
    const body = res.json()
    t.ok(body.shortURL)
    t.match(body.shortURL, new RegExp(`^${env.PROTOCOL}://${env.DOMAIN}`))

    // Verify custom expiry was used
    const shortParam = body.shortURL.split('/').pop()
    const storedURL = URLRepo.instance.read(shortParam)
    t.ok(
      dayjs(storedURL?.expiresAt).isSame(
        dayjs().add(customDays, 'days'),
        'day'
      )
    )
  })

  t.test('successfully encodes URL with no protocol by prepending https://', async (t) => {
    t.teardown(() => app.close())
    t.plan(4)
    const app = buildFastify()
    
    const testURL = 'example.com'  // URL with no protocol
    const res = await app.inject({
      method: 'POST',
      url: '/encode',
      payload: { url: testURL }
    })

    t.equal(res.statusCode, 200)
    const body = res.json()
    t.ok(body.shortURL)
    t.match(body.shortURL, new RegExp(`^${env.PROTOCOL}://${env.DOMAIN}`))

    // Verify the stored URL has https:// prepended
    const shortParam = body.shortURL.split('/').pop()
    const storedURL = URLRepo.instance.read(shortParam)
    t.equal(storedURL?.longURL, `https://${testURL}`)
  })

  t.test('returns 400 for invalid URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
    
    const res = await app.inject({
      method: 'POST',
      url: '/encode',
      payload: { url: 'not-a-valid-url' }
    })

    t.equal(res.statusCode, 400)
    const body = res.json()
    t.equal(body.error, 'Bad Request')
    t.ok(body.message)
  })
})

test('URLFollowHandler', async (t) => {
  t.test('successfully redirects to long URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
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

    const res = await app.inject({
      method: 'GET',
      url: `/${shortParam}`
    })

    t.equal(res.statusCode, 302)
    t.equal(res.headers.location, longURL)

    // Verify click count was incremented
    const storedURL = URLRepo.instance.read(shortParam)
    t.equal(storedURL?.clicks, 1)
  })

  t.test('returns 404 for non-existent short URL', async (t) => {
    t.teardown(() => app.close())
    t.plan(3)
    const app = buildFastify()
    
    const res = await app.inject({
      method: 'GET',
      url: '/nonexist' // 8 characters long
    })

    t.equal(res.statusCode, 404)
    const body = res.json()
    t.equal(body.error, 'Not Found')
    t.equal(body.message, 'Long URL not found')
  })
})
