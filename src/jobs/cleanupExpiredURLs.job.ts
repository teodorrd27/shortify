import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import { StorageManager } from '../storage.manager'
import dayjs from 'dayjs'

const cleanupExpiredURLsTask = new AsyncTask('clean up expired URLs', async () => {
  const now = dayjs()
  let descOrderedExpiryIndex = StorageManager.instance.descOrderedExpiryIndex
  while (descOrderedExpiryIndex.length > 0 && now.isAfter(dayjs(descOrderedExpiryIndex[descOrderedExpiryIndex.length - 1]))) {
    const expiredEntry = descOrderedExpiryIndex.pop()!
    StorageManager.instance.storage.delete(expiredEntry)
  }
})
export const cleanupExpiredURLsJob = new SimpleIntervalJob({ seconds: 1 }, cleanupExpiredURLsTask)
