import { z } from 'zod'

/**
 * Schema for API error response body (402 Payment Required)
 *
 * @public
 */
export const ApiErrorResponseSchema = z.object({
  message: z.string().optional(),
  upgrade_url: z.string().url().optional(),
  reset_at: z.string().optional(),
})

/**
 * Type for API error response
 *
 * @public
 */
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
