/**
 * You.com API endpoints
 *
 * These constants define the base URLs for You.com's APIs.
 * Exported for use in tests and external packages.
 */

export const SEARCH_API_URL = process.env.YDC_SEARCH_API_URL || 'https://ydc-index.io/v1/search'
export const DEEP_SEARCH_API_URL = process.env.YDC_DEEP_SEARCH_API_URL || 'https://api.you.com/v1/deep_search'
export const CONTENTS_API_URL = process.env.YDC_CONTENTS_API_URL || 'https://ydc-index.io/v1/contents'
