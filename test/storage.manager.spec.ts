import { test } from 'tap'
import { StorageManager } from '../src/storage.manager'
import { dateValidator } from '../src/validators/date.validator'

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
  storageManager.storage.set('test', { longURL: 'test', shortParam: 'test', createdAt: new Date(), expiresAt: new Date() })
  t.equal(storageManager.storage.size, 1)

  const newDate = dateValidator.parse(new Date().toISOString())
  storageManager.orderedExpiryIndex.push(newDate)
  t.equal(storageManager.orderedExpiryIndex[0], newDate)
})

test('BuildShortURL returns a valid short URL', async (t) => {
  t.plan(1)
  const storageManager = StorageManager.instance
  const shortURL = storageManager.buildShortURL('test')
  t.equal(shortURL, `https://${process.env.DOMAIN}/test`)
})
