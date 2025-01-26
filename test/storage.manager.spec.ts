import { test } from 'tap'
import { StorageManager } from '../src/storage.manager'
import { env } from '../src/env'

test('StorageManager underlying storage is modifiable', async (t) => {
  t.plan(1)
  const storageManager = StorageManager.instance
  storageManager.insert({
    longURL: 'test', shortParam: 'test', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  t.equal(storageManager.size, 1)
})

test('BuildShortURL returns a valid short URL', async (t) => {
  t.plan(1)
  const storageManager = StorageManager.instance
  const shortURL = storageManager.buildShortURL('test')

  t.equal(shortURL, `${env.PROTOCOL}://${env.DOMAIN}/test`)
})

test('Hasher returns a valid short URL', async (t) => {
  t.plan(1)
  const storageManager = StorageManager.instance
  const shortURL = storageManager.hash('https://example.com', '2025-01-25T00:00:00Z')

  t.equal(shortURL, 'ULJpBtAe')
})

test('Hasher handles collision', async (t) => {
  t.plan(1)
  const storageManager = StorageManager.instance
  storageManager.insert({
    longURL: 'https://example.com', shortParam: 'ULJpBtAe', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  const shortURL = storageManager.hash('https://example.com', '2025-01-25T00:00:00Z')

  t.equal(shortURL, '3aBb97D3')
})
