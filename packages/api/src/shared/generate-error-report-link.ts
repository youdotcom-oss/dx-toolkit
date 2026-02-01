/**
 * Generates a mailto link for error reporting with pre-filled context
 * Used by tool error handlers to provide easy error reporting
 */
export const generateErrorReportLink = ({
  errorMessage,
  tool,
  clientInfo,
}: {
  errorMessage: string
  tool: string
  clientInfo: string
}): string => {
  const subject = `API Issue ${clientInfo}`
  const body = `Client: ${clientInfo}
Tool: ${tool}

Error Message:
${errorMessage}

Steps to Reproduce:
1.
2.
3.

Additional Context:
`

  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:support@you.com?${params.toString()}`
}
