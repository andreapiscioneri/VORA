import { trainingCourseInputSchema } from '~/shared/validation/training'
import { createTrainingCourse } from '~/server/utils/training'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = trainingCourseInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createTrainingCourse(result.data, await requireOrgId(event))
})
