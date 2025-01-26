import { test } from 'tap'
import { URLRepo } from '../../src/repos/url.repo'
import { env } from '../../src/env'

test('URLRepo underlying storage is modifiable', async (t) => {
  t.plan(1)
  const urlRepo = URLRepo.instance
  urlRepo.insert({
    longURL: 'test', shortParam: 'test', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  t.equal(urlRepo.size, 1)
})

test('BuildShortURL returns a valid short URL', async (t) => {
  t.plan(1)
  const urlRepo = URLRepo.instance
  const shortURL = urlRepo.buildShortURL('test')

  t.equal(shortURL, `${env.PROTOCOL}://${env.DOMAIN}/test`)
})

test('Hasher returns a valid short URL', async (t) => {
  t.plan(1)
  const urlRepo = URLRepo.instance
  const shortURL = urlRepo.hash('https://example.com', '2025-01-25T00:00:00Z')

  t.equal(shortURL, 'ULJpBtAe')
})

test('Hasher handles collision', async (t) => {
  t.plan(1)
  const urlRepo = URLRepo.instance
  urlRepo.insert({
    longURL: 'https://example.com', shortParam: 'ULJpBtAe', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  const shortURL = urlRepo.hash('https://example.com', '2025-01-25T00:00:00Z')

  t.equal(shortURL, '3aBb97D3')
})
