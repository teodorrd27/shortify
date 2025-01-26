import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import { URLRepo } from '../repos/url.repo'
import dayjs from 'dayjs'

const cleanupCallback = async () => {
  const now = dayjs()
  while (URLRepo.instance.isLastOrderedEntryExpired(now)) {
    URLRepo.instance.deleteLastEntry()
  }
}

const cleanupExpiredURLsTask = new AsyncTask('clean up expired URLs', cleanupCallback)
export const cleanupExpiredURLsJob = new SimpleIntervalJob({ seconds: 1 }, cleanupExpiredURLsTask)

export { cleanupCallback }
