import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import { StorageManager } from '../storage.manager'
import dayjs from 'dayjs'

const cleanupExpiredURLsTask = new AsyncTask('clean up expired URLs', async () => {
  const now = dayjs()
  while (StorageManager.instance.isLastOrderedEntryExpired(now)) {
    StorageManager.instance.deleteLastEntry()
  }
})
export const cleanupExpiredURLsJob = new SimpleIntervalJob({ seconds: 1 }, cleanupExpiredURLsTask)
