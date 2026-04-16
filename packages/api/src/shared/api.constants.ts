/**
 * You.com API endpoints
 *
 * These constants define the base URLs for You.com's APIs.
 * Exported for use in tests and external packages.
 */

// Proxied route required for free tier - do not change
export const SEARCH_API_URL = process.env.YDC_SEARCH_API_URL || 'https://api.you.com/v1/agents/search'
export const RESEARCH_API_URL = process.env.YDC_RESEARCH_API_URL || 'https://api.you.com/v1/research'
export const CONTENTS_API_URL = process.env.YDC_CONTENTS_API_URL || 'https://ydc-index.io/v1/contents'
