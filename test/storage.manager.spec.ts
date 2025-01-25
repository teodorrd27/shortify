import { test } from 'tap'
import { StorageManager } from '../src/storage.manager'
import { env } from '../src/env'

test('StorageManager instance is read-only', async (t) => {
  t.plan(2)
  const storageManager = StorageManager.instance
  t.throws(() => {
    storageManager.storage = new Map()
  })
  t.throws(() => {
    storageManager.orderedExpiryIndex = []
  })
})

test('StorageManager underlying storage is modifiable', async (t) => {
  t.plan(2)
  const storageManager = StorageManager.instance
  storageManager.storage.set('test', {
    longURL: 'test', shortParam: 'test', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  t.equal(storageManager.storage.size, 1)

  const newDate = new Date().toISOString()
  storageManager.orderedExpiryIndex.push(newDate)
  t.equal(storageManager.orderedExpiryIndex[0], newDate)
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
  storageManager.storage.set('ULJpBtAe', {
    longURL: 'https://example.com', shortParam: 'ULJpBtAe', createdAt: new Date(), expiresAt: new Date(),
    clicks: 0
  })
  const shortURL = storageManager.hash('https://example.com', '2025-01-25T00:00:00Z')

  t.equal(shortURL, '3aBb97D3')
})
