import { test } from 'tap'

import { buildFastify } from '../../src/app'
import { URLRepo } from '../../src/repos/url.repo'
import { URLService } from '../../src/services/url.service'
import { cleanupExpiredURLsJob } from '../../src/jobs/cleanupExpiredURLs.job'

test('scheduler cleans up expired URLs', async (t) => {
  const app = buildFastify()
  const urlRepo = URLRepo.instance
  const urlService = new URLService(urlRepo)
  
  // URL that expires in 1 second
  const shortURL1 = urlService.createShortURL('http://example1.com', 1/3600/24) // 1 second in hours
  const param1 = urlRepo.extractShortParam(shortURL1)
  
  // URL that expires in 2 seconds
  const shortURL2 = urlService.createShortURL('http://example2.com', 2/3600/24) // 2 seconds in hours
  const param2 = urlRepo.extractShortParam(shortURL2)
  
  // URL that expires in 5 seconds
  const shortURL3 = urlService.createShortURL('http://example3.com', 5/3600/24) // 5 seconds in hours
  const param3 = urlRepo.extractShortParam(shortURL3)
  
  // URL that expires in 1 hour
  const shortURL4 = urlService.createShortURL('http://example4.com', 1/24) // 1 hour
  const param4 = urlRepo.extractShortParam(shortURL4)

  // Start scheduler to run every second
  await app.ready()
  app.scheduler.addSimpleIntervalJob(cleanupExpiredURLsJob)
  
  // Wait 1.5 seconds and check
  await new Promise(resolve => setTimeout(resolve, 1500))
  t.notOk(urlRepo.read(param1), 'URL1 should be deleted after 1.5s')
  t.ok(urlRepo.read(param2), 'URL2 should still exist after 1.5s')
  t.ok(urlRepo.read(param3), 'URL3 should still exist after 1.5s')
  t.ok(urlRepo.read(param4), 'URL4 should still exist after 1.5s')

  // Wait another 1 second (2.5s total) and check
  await new Promise(resolve => setTimeout(resolve, 1000))
  t.notOk(urlRepo.read(param1), 'URL1 should still be deleted after 2.5s')
  t.notOk(urlRepo.read(param2), 'URL2 should be deleted after 2.5s')
  t.ok(urlRepo.read(param3), 'URL3 should still exist after 2.5s')
  t.ok(urlRepo.read(param4), 'URL4 should still exist after 2.5s')

  // Wait another 3 seconds (5.5s total) and check
  await new Promise(resolve => setTimeout(resolve, 3000))
  t.notOk(urlRepo.read(param1), 'URL1 should still be deleted after 5.5s')
  t.notOk(urlRepo.read(param2), 'URL2 should still be deleted after 5.5s')
  t.notOk(urlRepo.read(param3), 'URL3 should be deleted after 5.5s')
  t.ok(urlRepo.read(param4), 'URL4 should still exist after 5.5s')

  await app.close()
})
