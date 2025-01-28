import { test } from 'tap'
import { URLRepo } from '../../src/repos/url.repo'
import { env } from '../../src/env'
import dayjs from 'dayjs'

test('insert | read: URLRepo underlying storage is modifiable', async (t) => {
  t.after(() => URLRepo.instance.drop())

  t.plan(2)
  const urlRepo = URLRepo.instance
  const now = new Date()
  urlRepo.insert({
    longURL: 'test', shortParam: 'test', createdAt: now, expiresAt: now,
    clicks: 0
  })
  const readRepo = URLRepo.instance.read('test')
  t.same(readRepo, {
    clicks: 0,
    createdAt: now,
    expiresAt: now,
    longURL: 'test',
    shortParam: 'test'
  })
  t.equal(urlRepo.size, 1)
})

test('incrementClicks: URLRepo underlying storage is modifiable', async (t) => {
  t.after(() => URLRepo.instance.drop())

  t.plan(1)
  const urlRepo = URLRepo.instance
  urlRepo.insert({
    longURL: 'test', shortParam: 'test', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  urlRepo.incrementClicks('test')
  t.equal(urlRepo.read('test')?.clicks, 1)
})

test('extractShortParam: returns the short param from a URL', async (t) => {
  t.after(() => URLRepo.instance.drop())

  t.plan(1)
  const urlRepo = URLRepo.instance
  const shortParam = urlRepo.extractShortParam('https://example.com/test')
  t.equal(shortParam, 'test')
})

test('isLastOrderedEntryExpired: returns true if the last entry is expired', async (t) => {
  t.after(() => URLRepo.instance.drop())

  t.plan(1)
  const urlRepo = URLRepo.instance
  const oneMinuteAgo = dayjs().subtract(1, 'minute')
  URLRepo.instance.insert({
    longURL: 'test', 
    shortParam: 'test', 
    createdAt: oneMinuteAgo.toDate(), 
    expiresAt: oneMinuteAgo.toDate(),
    clicks: 0
  })
  const isExpired = urlRepo.isLastOrderedEntryExpired(dayjs())
  t.equal(isExpired, true)
})

test('deleteLastEntry: deletes the last entry from the underlying storage', async (t) => {
  t.after(() => URLRepo.instance.drop())

  t.plan(2)
  const urlRepo = URLRepo.instance
  const dateNow = new Date()
  urlRepo.insert({
    longURL: 'test', shortParam: 'test', createdAt: dateNow, expiresAt: dateNow,
    clicks: 0
  })
  const check = urlRepo.read('test')
  t.same(check, {
    clicks: 0,
    createdAt: dateNow,
    expiresAt: dateNow,
    longURL: 'test',
    shortParam: 'test'
  })
  urlRepo.deleteLastEntry()
  t.equal(urlRepo.size, 0)
})

test('BuildShortURL returns a valid short URL', async (t) => {
  t.after(() => URLRepo.instance.drop())

  t.plan(1)
  const urlRepo = URLRepo.instance
  const shortURL = urlRepo.buildShortURL('test')

  t.equal(shortURL, `${env.PROTOCOL}://${env.DOMAIN}/test`)
})

test('hash', (t) => {
  t.afterEach(() => URLRepo.instance.drop())
  
  t.plan(3)

  t.test('returns a valid short URL', async (t) => {
    const urlRepo = URLRepo.instance
    const shortURL = urlRepo.hash('https://example.com', '2025-01-25T00:00:00Z')
  
    t.equal(shortURL, 'ULJpBtAe')
  })

  t.test('handles collision', async (t) => {
    const urlRepo = URLRepo.instance
    urlRepo.insert({
      longURL: 'https://example.com', shortParam: 'ULJpBtAe', createdAt: new Date(), expiresAt: new Date(),
      clicks: 0
    })
    const shortURL = urlRepo.hash('https://example.com', '2025-01-25T00:00:00Z')
  
    t.equal(shortURL, '3aBb97D3')
  })

  t.test('throws an error if it cannot generate a unique hash', async (t) => {
    const urlRepo = URLRepo.instance
    const date = '2025-01-25T00:00:00Z'
    const maxSalt = 10
    for (let i = 0; i < maxSalt; i++) {
      const shortURL = urlRepo.hash('https://example.com', date)
      URLRepo.instance.insert({
        clicks: 0,
        createdAt: new Date('2025-01-25T00:00:00Z'),
        expiresAt: new Date(),
        longURL: 'https://example.com',
        shortParam: shortURL
      })
    }
    t.throws(() => urlRepo.hash('https://example.com', date))
  })
})

