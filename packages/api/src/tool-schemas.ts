// This file is generated. Do not edit by hand.
export const API_TOOL_SCHEMA_HASH = '0c74f7091eca6ec01a70e3bc62029873e7dac682b473ddcc7c39fa1df35ddf65'

export const API_TOOL_SCHEMAS = {
  'you-balance': {
    inputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      properties: {},
      type: 'object',
    },
    outputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      properties: {
        data: {
          additionalProperties: false,
          properties: {
            attributes: {
              additionalProperties: false,
              properties: {
                balance: {
                  description: 'Remaining credit balance in cents. Divide by 100 to convert to USD.',
                  type: 'number',
                },
              },
              required: ['balance'],
              type: 'object',
            },
            id: {
              description: 'A hashed identifier for the billing entity (user or organization).',
              type: 'string',
            },
            type: {
              description: 'The type of billing entity. Always "account".',
              type: 'string',
            },
          },
          required: ['type', 'id', 'attributes'],
          type: 'object',
        },
      },
      required: ['data'],
      type: 'object',
    },
  },
  'you-contents': {
    inputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      properties: {
        crawl_timeout: {
          description: 'Optional timeout in seconds (1-60) for page crawling',
          maximum: 60,
          minimum: 1,
          type: 'number',
        },
        format: {
          description: '(Deprecated) Output format - use formats array instead',
          enum: ['markdown', 'html'],
          type: 'string',
        },
        formats: {
          description: 'Output formats: array of "markdown" (text), "html" (layout), or "metadata" (structured data)',
          items: {
            enum: ['markdown', 'html', 'metadata'],
            type: 'string',
          },
          type: 'array',
        },
        urls: {
          description: 'Array of webpage URLs to extract content from (e.g., ["https://example.com"])',
          items: {
            description: 'Webpage URL to extract content from. Runtime validation requires a public http or https URL.',
            format: 'uri',
            type: 'string',
          },
          maxItems: 100,
          minItems: 1,
          type: 'array',
        },
      },
      required: ['urls'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      properties: {
        output: {
          items: {
            additionalProperties: false,
            properties: {
              html: {
                anyOf: [
                  {
                    type: 'string',
                  },
                  {
                    type: 'null',
                  },
                ],
                description: 'HTML content',
              },
              markdown: {
                anyOf: [
                  {
                    type: 'string',
                  },
                  {
                    type: 'null',
                  },
                ],
                description: 'Markdown content',
              },
              metadata: {
                anyOf: [
                  {
                    additionalProperties: false,
                    properties: {
                      favicon_url: {
                        anyOf: [
                          {
                            type: 'string',
                          },
                          {
                            type: 'null',
                          },
                        ],
                        description: 'Favicon URL',
                      },
                      site_name: {
                        anyOf: [
                          {
                            type: 'string',
                          },
                          {
                            type: 'null',
                          },
                        ],
                        description: 'OpenGraph site name',
                      },
                    },
                    type: 'object',
                  },
                  {
                    type: 'null',
                  },
                ],
                description: 'Page metadata (only when metadata format requested)',
              },
              title: {
                description: 'Title (optional in actual API responses)',
                type: 'string',
              },
              url: {
                description: 'URL',
                type: 'string',
              },
            },
            required: ['url'],
            type: 'object',
          },
          type: 'array',
        },
      },
      required: ['output'],
      type: 'object',
    },
  },
  'you-research': {
    inputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      properties: {
        input: {
          description:
            'The research question or complex query requiring in-depth investigation and multi-step reasoning. Maximum length: 40,000 characters.',
          maxLength: 40000,
          minLength: 1,
          type: 'string',
        },
        research_effort: {
          default: 'standard',
          description:
            'Controls how much time and effort the Research API spends on your question. lite: fast answers, standard: balanced (default), deep: thorough, exhaustive: most comprehensive.',
          enum: ['lite', 'standard', 'deep', 'exhaustive'],
          type: 'string',
        },
      },
      required: ['input'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      properties: {
        output: {
          additionalProperties: false,
          description: 'The research output containing the answer and sources',
          properties: {
            content: {
              description: 'Comprehensive response with inline citations, formatted in Markdown',
              type: 'string',
            },
            content_type: {
              description: 'The format of the content field',
              enum: ['text'],
              type: 'string',
            },
            sources: {
              description: 'List of web sources used to generate the answer',
              items: {
                additionalProperties: false,
                properties: {
                  snippets: {
                    description: 'Relevant excerpts from the source page used in generating the answer',
                    items: {
                      type: 'string',
                    },
                    type: 'array',
                  },
                  title: {
                    description: 'Source webpage title',
                    type: 'string',
                  },
                  url: {
                    description: 'Source webpage URL',
                    type: 'string',
                  },
                },
                required: ['url'],
                type: 'object',
              },
              type: 'array',
            },
          },
          required: ['content', 'content_type', 'sources'],
          type: 'object',
        },
      },
      required: ['output'],
      type: 'object',
    },
  },
  'you-search': {
    inputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      properties: {
        count: {
          description: 'Max results per section',
          maximum: 100,
          minimum: 1,
          type: 'integer',
        },
        country: {
          description: 'Country code',
          enum: [
            'AR',
            'AU',
            'AT',
            'BE',
            'BR',
            'CA',
            'CL',
            'DK',
            'FI',
            'FR',
            'DE',
            'HK',
            'IN',
            'ID',
            'IT',
            'JP',
            'KR',
            'MY',
            'MX',
            'NL',
            'NZ',
            'NO',
            'CN',
            'PL',
            'PT',
            'PH',
            'RU',
            'SA',
            'ZA',
            'ES',
            'SE',
            'CH',
            'TW',
            'TR',
            'GB',
            'US',
          ],
          type: 'string',
        },
        crawl_timeout: {
          description: 'Crawl timeout in seconds (1-60)',
          maximum: 60,
          minimum: 1,
          type: 'integer',
        },
        exclude_domains: {
          description: 'Domains to exclude from results (up to 500)',
          items: {
            type: 'string',
          },
          maxItems: 500,
          type: 'array',
        },
        freshness: {
          description: 'day/week/month/year or YYYY-MM-DDtoYYYY-MM-DD',
          type: 'string',
        },
        include_domains: {
          description: 'Domains to include in results (up to 500)',
          items: {
            type: 'string',
          },
          maxItems: 500,
          type: 'array',
        },
        language: {
          description: 'Language code (BCP 47 format)',
          enum: [
            'AR',
            'EU',
            'BN',
            'BG',
            'CA',
            'ZH-HANS',
            'ZH-HANT',
            'HR',
            'CS',
            'DA',
            'NL',
            'EN',
            'EN-GB',
            'ET',
            'FI',
            'FR',
            'GL',
            'DE',
            'EL',
            'GU',
            'HE',
            'HI',
            'HU',
            'IS',
            'IT',
            'JA',
            'KN',
            'KO',
            'LV',
            'LT',
            'MS',
            'ML',
            'MR',
            'NB',
            'PL',
            'PT-BR',
            'PT-PT',
            'PA',
            'RO',
            'RU',
            'SR',
            'SK',
            'SL',
            'ES',
            'SV',
            'TA',
            'TE',
            'TH',
            'TR',
            'UK',
            'VI',
          ],
          type: 'string',
        },
        livecrawl: {
          description: 'Live-crawl sections for full content',
          enum: ['web', 'news', 'all'],
          type: 'string',
        },
        livecrawl_formats: {
          description: 'Formats for crawled content',
          items: {
            enum: ['html', 'markdown'],
            type: 'string',
          },
          type: 'array',
        },
        offset: {
          description: 'Pagination offset',
          maximum: 9,
          minimum: 0,
          type: 'integer',
        },
        query: {
          description:
            'Search query. Supports operators: site:domain.com (domain filter), filetype:pdf (file type), +term (include), -term (exclude), AND/OR/NOT (boolean logic), lang:en (language). Example: "machine learning (Python OR PyTorch) -TensorFlow filetype:pdf"',
          minLength: 1,
          type: 'string',
        },
        safesearch: {
          description: 'Filter level',
          enum: ['off', 'moderate', 'strict'],
          type: 'string',
        },
      },
      required: ['query'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      properties: {
        metadata: {
          additionalProperties: false,
          properties: {
            latency: {
              description: 'Latency in seconds',
              type: 'number',
            },
            query: {
              description: 'Query',
              type: 'string',
            },
            search_uuid: {
              description: 'Unique search request ID',
              type: 'string',
            },
          },
          type: 'object',
        },
        results: {
          additionalProperties: false,
          properties: {
            news: {
              items: {
                additionalProperties: false,
                properties: {
                  contents: {
                    additionalProperties: false,
                    description: 'Live-crawled page content',
                    properties: {
                      html: {
                        description: 'Full HTML content',
                        type: 'string',
                      },
                      markdown: {
                        description: 'Full Markdown content',
                        type: 'string',
                      },
                    },
                    type: 'object',
                  },
                  description: {
                    description: 'Description',
                    type: 'string',
                  },
                  page_age: {
                    description: 'Publication timestamp',
                    type: 'string',
                  },
                  thumbnail_url: {
                    description: 'Thumbnail image URL',
                    type: 'string',
                  },
                  title: {
                    description: 'Title',
                    type: 'string',
                  },
                  url: {
                    description: 'URL',
                    type: 'string',
                  },
                },
                type: 'object',
              },
              type: 'array',
            },
            web: {
              items: {
                additionalProperties: false,
                properties: {
                  authors: {
                    description: 'Authors',
                    items: {
                      type: 'string',
                    },
                    type: 'array',
                  },
                  contents: {
                    additionalProperties: false,
                    description: 'Live-crawled page content',
                    properties: {
                      html: {
                        description: 'Full HTML content',
                        type: 'string',
                      },
                      markdown: {
                        description: 'Full Markdown content',
                        type: 'string',
                      },
                    },
                    type: 'object',
                  },
                  description: {
                    description: 'Description',
                    type: 'string',
                  },
                  favicon_url: {
                    description: 'Favicon URL',
                    type: 'string',
                  },
                  page_age: {
                    description: 'Publication timestamp',
                    type: 'string',
                  },
                  snippets: {
                    description: 'Content snippets',
                    items: {
                      type: 'string',
                    },
                    type: 'array',
                  },
                  thumbnail_url: {
                    description: 'Thumbnail image URL',
                    type: 'string',
                  },
                  title: {
                    description: 'Title',
                    type: 'string',
                  },
                  url: {
                    description: 'URL',
                    type: 'string',
                  },
                },
                type: 'object',
              },
              type: 'array',
            },
          },
          type: 'object',
        },
      },
      required: ['results', 'metadata'],
      type: 'object',
    },
  },
} as const

export type YouBalanceInput = Record<string, unknown>

export type YouBalanceOutput = {
  data: {
    attributes: {
      balance: number
    }
    id: string
    type: string
  }
}

export type YouContentsInput = {
  crawl_timeout?: number
  format?: 'markdown' | 'html'
  formats?: Array<'markdown' | 'html' | 'metadata'>
  urls: Array<string>
}

export type YouContentsOutput = {
  output: Array<{
    html?: string | null
    markdown?: string | null
    metadata?: {
      favicon_url?: string | null
      site_name?: string | null
    } | null
    title?: string
    url: string
  }>
}

export type YouResearchInput = {
  input: string
  research_effort?: 'lite' | 'standard' | 'deep' | 'exhaustive'
}

export type YouResearchOutput = {
  output: {
    content: string
    content_type: 'text'
    sources: Array<{
      snippets?: Array<string>
      title?: string
      url: string
    }>
  }
}

export type YouSearchInput = {
  count?: number
  country?:
    | 'AR'
    | 'AU'
    | 'AT'
    | 'BE'
    | 'BR'
    | 'CA'
    | 'CL'
    | 'DK'
    | 'FI'
    | 'FR'
    | 'DE'
    | 'HK'
    | 'IN'
    | 'ID'
    | 'IT'
    | 'JP'
    | 'KR'
    | 'MY'
    | 'MX'
    | 'NL'
    | 'NZ'
    | 'NO'
    | 'CN'
    | 'PL'
    | 'PT'
    | 'PH'
    | 'RU'
    | 'SA'
    | 'ZA'
    | 'ES'
    | 'SE'
    | 'CH'
    | 'TW'
    | 'TR'
    | 'GB'
    | 'US'
  crawl_timeout?: number
  exclude_domains?: Array<string>
  freshness?: string
  include_domains?: Array<string>
  language?:
    | 'AR'
    | 'EU'
    | 'BN'
    | 'BG'
    | 'CA'
    | 'ZH-HANS'
    | 'ZH-HANT'
    | 'HR'
    | 'CS'
    | 'DA'
    | 'NL'
    | 'EN'
    | 'EN-GB'
    | 'ET'
    | 'FI'
    | 'FR'
    | 'GL'
    | 'DE'
    | 'EL'
    | 'GU'
    | 'HE'
    | 'HI'
    | 'HU'
    | 'IS'
    | 'IT'
    | 'JA'
    | 'KN'
    | 'KO'
    | 'LV'
    | 'LT'
    | 'MS'
    | 'ML'
    | 'MR'
    | 'NB'
    | 'PL'
    | 'PT-BR'
    | 'PT-PT'
    | 'PA'
    | 'RO'
    | 'RU'
    | 'SR'
    | 'SK'
    | 'SL'
    | 'ES'
    | 'SV'
    | 'TA'
    | 'TE'
    | 'TH'
    | 'TR'
    | 'UK'
    | 'VI'
  livecrawl?: 'web' | 'news' | 'all'
  livecrawl_formats?: Array<'html' | 'markdown'>
  offset?: number
  query: string
  safesearch?: 'off' | 'moderate' | 'strict'
}

export type YouSearchOutput = {
  metadata: {
    latency?: number
    query?: string
    search_uuid?: string
  }
  results: {
    news?: Array<{
      contents?: {
        html?: string
        markdown?: string
      }
      description?: string
      page_age?: string
      thumbnail_url?: string
      title?: string
      url?: string
    }>
    web?: Array<{
      authors?: Array<string>
      contents?: {
        html?: string
        markdown?: string
      }
      description?: string
      favicon_url?: string
      page_age?: string
      snippets?: Array<string>
      thumbnail_url?: string
      title?: string
      url?: string
    }>
  }
}

export type KnownToolName = keyof typeof API_TOOL_SCHEMAS

type KnownToolInputMap = {
  'you-balance': YouBalanceInput
  'you-contents': YouContentsInput
  'you-research': YouResearchInput
  'you-search': YouSearchInput
}

type KnownToolOutputMap = {
  'you-balance': YouBalanceOutput
  'you-contents': YouContentsOutput
  'you-research': YouResearchOutput
  'you-search': YouSearchOutput
}

export type KnownToolInput<T extends KnownToolName> = KnownToolInputMap[T]

export type KnownToolOutput<T extends KnownToolName> = KnownToolOutputMap[T]
