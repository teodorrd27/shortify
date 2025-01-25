import { dateValidator } from '../../src/validators/date.validator'
import { test } from 'tap'

test('dateValidator validates ISO date strings', async (t) => {
  t.plan(5)
  
  const validDatetime1 = '2023-12-25T12:00:00Z'
  const validDatetime2 = '2023-12-25T12:00:00.000Z'
  const invalidDatetime1 = '2023-12-25'
  const invalidDatetime2 = '2023-12-25T12:00:00'
  const invalidDatetime3 = 'not a date'

  t.ok(dateValidator.safeParse(validDatetime1).success)
  t.ok(dateValidator.safeParse(validDatetime2).success)
  t.notOk(dateValidator.safeParse(invalidDatetime1).success)
  t.notOk(dateValidator.safeParse(invalidDatetime2).success) 
  t.notOk(dateValidator.safeParse(invalidDatetime3).success)
})
