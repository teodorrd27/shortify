import { test } from 'tap'
import { URLRepo } from '../../src/repos/url.repo'
import { cleanupCallback } from '../../src/jobs/cleanupExpiredURLs.job'
import dayjs from 'dayjs'

test('cleanupCallback: deletes expired URLs', async (t) => {
  t.after(() => URLRepo.instance.drop())
  
  t.plan(2)

  const oneMinuteAgo = dayjs().subtract(1, 'minute')
  URLRepo.instance.insert({
    longURL: 'test', shortParam: 'test', createdAt: oneMinuteAgo.toDate(), expiresAt: oneMinuteAgo.toDate(),
    clicks: 0
  })
  t.equal(URLRepo.instance.size, 1)

  await cleanupCallback()

  t.equal(URLRepo.instance.size, 0)
})
