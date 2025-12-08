export const DEFAULT_SERVER_URL = 'http://localhost:4000/mcp';
export const DEFAULT_CLIENT_NAME = 'youdotcom-ai-sdk-plugin';
export const API_KEY_ENV_VAR = 'YDC_API_KEY';

export const EXPECTED_TOOLS = ['you-search', 'you-express', 'you-contents'] as const;

export type ExpectedToolName = (typeof EXPECTED_TOOLS)[number];
