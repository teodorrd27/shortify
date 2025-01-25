import { z } from 'zod'
import { LooseISODateString } from '../types/storage.type'

const dateValidator = z.string().datetime() as z.ZodType<LooseISODateString>

export { dateValidator }
