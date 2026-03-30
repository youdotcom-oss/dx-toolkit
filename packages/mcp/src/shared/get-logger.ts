import type { LoggingMessageNotification, ServerNotification } from '@modelcontextprotocol/sdk/types.js'

/**
 * Creates a logger that routes notifications through the request's SSE stream
 *
 * @remarks
 * Uses `extra.sendNotification` from the tool callback, which attaches `relatedRequestId`
 * so the transport routes the message to the POST SSE stream (not the standalone GET stream).
 *
 * @param sendNotification - From the tool callback's `extra` parameter
 * @returns Async function that sends logging notifications
 *
 * @internal
 */
export const getLogger =
  (sendNotification: (notification: ServerNotification) => Promise<void>) =>
  async (params: LoggingMessageNotification['params']) => {
    await sendNotification({ method: 'notifications/message', params })
  }
