import * as z from 'zod'

/**
 * Schema for API error response body (402 Payment Required)
 *
 * @public
 */
export const ApiErrorResponseSchema = z.object({
  message: z.string().optional(),
  // Use .refine() instead of .url() to ensure JSON schema includes "type": "string"
  // This is required for OpenAI function calling schema validation
  upgrade_url: z
    .string()
    .refine(
      (val) => {
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      },
      { message: 'Invalid URL format' },
    )
    .optional(),
  reset_at: z.string().optional(),
})

/**
 * Type for API error response
 *
 * @public
 */
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
