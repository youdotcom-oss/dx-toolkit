import packageJson from '../../package.json' with { type: 'json' };
/**
 * Generates a mailto link for error reporting with pre-filled context
 * Used by tool error handlers to provide easy error reporting
 */
export const generateErrorReportLink = ({
  errorMessage,
  tool,
  clientInfo,
}: {
  errorMessage: string;
  tool: string;
  clientInfo: string;
}): string => {
  const subject = `MCP Server Issue v${packageJson.version}`;
  const body = `Server Version: v${packageJson.version}
Client: ${clientInfo}
Tool: ${tool}

Error Message:
${errorMessage}

Steps to Reproduce:
1.
2.
3.

Additional Context:
`;

  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:support@you.com?${params.toString()}`;
};
