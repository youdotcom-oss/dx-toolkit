// This file is generated. Do not edit by hand.
export const API_TOOL_SCHEMA_HASH = '15eb272d4e37ef1355c1c641128c9c7bfc4654209fe8e341cc1eae97f7f4bf55'

export const API_TOOL_SCHEMAS = {
  'you-answer': {
    inputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        boost_domains: {
          description:
            'Domains to prefer in ranking (up to 500). Can combine with exclude_domains, not include_domains.',
          items: {
            type: 'string',
          },
          maxItems: 500,
          type: 'array',
        },
        country: {
          description: 'A supported country code that determines the geographical focus',
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
          description: 'Domains to exclusively include (up to 500)',
          items: {
            type: 'string',
          },
          maxItems: 500,
          type: 'array',
        },
        language: {
          description: 'A supported BCP 47 language tag that determines the language',
          enum: [
            'AR',
            'EU',
            'BN',
            'BG',
            'CA',
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
            'KN',
            'KO',
            'LV',
            'LT',
            'MS',
            'ML',
            'MR',
            'NB',
            'PL',
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
        query: {
          description:
            'Focused live-web question or lookup request. Returns a synthesized answer with inline citations, citation excerpts, and supporting web results.',
          minLength: 1,
          type: 'string',
        },
      },
      required: ['query'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        answer: {
          description: 'The synthesized response with numbered inline citations',
          type: 'string',
        },
        citations: {
          description: 'The sources cited in the answer, in citation order',
          items: {
            additionalProperties: false,
            properties: {
              excerpts: {
                description: 'Verbatim excerpts from the cited source that support the answer',
                items: {
                  type: 'string',
                },
                type: 'array',
              },
              source: {
                description: 'The URL of the cited source',
                type: 'string',
              },
            },
            required: ['source', 'excerpts'],
            type: 'object',
          },
          type: 'array',
        },
        results: {
          additionalProperties: false,
          description: 'Search results grouped by result type',
          properties: {
            web: {
              description: 'All web search results considered during answer synthesis',
              items: {
                additionalProperties: false,
                properties: {
                  page_age: {
                    description: 'The publication date or age supplied by the search result',
                    type: 'string',
                  },
                  snippets: {
                    description: 'Text snippets from the search result that preview its content',
                    items: {
                      type: 'string',
                    },
                    type: 'array',
                  },
                  title: {
                    description: 'The title of the source webpage',
                    type: 'string',
                  },
                  url: {
                    description: 'The URL of the source webpage',
                    type: 'string',
                  },
                },
                required: ['url', 'title'],
                type: 'object',
              },
              type: 'array',
            },
          },
          required: ['web'],
          type: 'object',
        },
      },
      required: ['answer', 'citations', 'results'],
      type: 'object',
    },
  },
  'you-contents': {
    inputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        crawl_timeout: {
          description: 'Optional timeout in seconds (1-60) for page crawling',
          maximum: 60,
          minimum: 1,
          type: 'number',
        },
        formats: {
          default: ['markdown'],
          description: 'Output formats: array of "markdown" (text), "html" (layout), or "metadata" (structured data)',
          items: {
            enum: ['markdown', 'html', 'metadata'],
            type: 'string',
          },
          type: 'array',
        },
        max_age: {
          anyOf: [
            {
              maximum: 9007199254740991,
              minimum: 0,
              type: 'integer',
            },
            {
              type: 'null',
            },
          ],
          description:
            'Maximum allowed age of cached content in seconds. When set, cached content older than this threshold is ignored and the page is re-fetched. Must be 0 or greater. Default: null (no age limit).',
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
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        output: {
          description: 'Extracted page content, one entry per requested URL',
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
                description: 'Full HTML content of the page',
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
                description: 'Full Markdown content of the page',
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
                description: 'Page title',
                type: 'string',
              },
              url: {
                description: 'URL of the extracted page',
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
  'you-discover': {
    inputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        finder: {
          default: 'all',
          description: 'Which Agent Finder discovery service(s) to query.',
          enum: ['github', 'huggingface', 'all'],
          type: 'string',
        },
        finder_url: {
          description: 'Optional custom finder URL (must be public http/https). Augments selected finders.',
          format: 'uri',
          type: 'string',
        },
        limit: {
          default: 10,
          description: 'Max consolidated results (1–25).',
          maximum: 25,
          minimum: 1,
          type: 'integer',
        },
        query: {
          description: 'Natural-language task to find agents/tools for.',
          minLength: 1,
          type: 'string',
        },
      },
      required: ['query'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        finders: {
          additionalProperties: false,
          description: 'Per-finder request status',
          properties: {
            failed: {
              description: 'Finder services that failed to respond',
              items: {
                type: 'string',
              },
              type: 'array',
            },
            queried: {
              description: 'Finder services that were queried',
              items: {
                type: 'string',
              },
              type: 'array',
            },
            responded: {
              description: 'Finder services that returned results',
              items: {
                type: 'string',
              },
              type: 'array',
            },
          },
          required: ['queried', 'responded', 'failed'],
          type: 'object',
        },
        query: {
          description: 'The original discovery query',
          type: 'string',
        },
        referrals: {
          description: 'Informational referrals to non-result resources',
          items: {
            additionalProperties: {},
            properties: {
              identifier: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
              url: {
                type: 'string',
              },
            },
            required: ['identifier', 'type', 'url'],
            type: 'object',
          },
          type: 'array',
        },
        results: {
          description: 'Ranked consolidated results, highest score first',
          items: {
            additionalProperties: false,
            properties: {
              description: {
                description: 'Short description of the resource',
                type: 'string',
              },
              displayName: {
                description: 'Human-readable name of the resource',
                type: 'string',
              },
              identifier: {
                description: 'Stable URN identifier for the discovered resource',
                type: 'string',
              },
              publisher: {
                description: 'Publisher domain parsed from the identifier',
                type: 'string',
              },
              resourceKind: {
                description: 'Normalized resource kind for filtering/display (mcp-server, a2a-agent, skill, api, raw)',
                enum: ['mcp-server', 'a2a-agent', 'skill', 'api', 'raw'],
                type: 'string',
              },
              score: {
                description:
                  'Finder-provided relevance score, higher is better; not a trust, quality, or safety rating',
                type: 'number',
              },
              sources: {
                description: 'Finder base URLs that returned this result',
                items: {
                  type: 'string',
                },
                type: 'array',
              },
              type: {
                description:
                  'Raw ARD resource MIME type (e.g. application/mcp-server+json, application/a2a-agent-card+json, application/ai-skill)',
                type: 'string',
              },
              url: {
                description: 'URL to access or install the resource',
                type: 'string',
              },
            },
            required: ['identifier', 'displayName', 'type', 'resourceKind', 'url', 'score', 'sources'],
            type: 'object',
          },
          type: 'array',
        },
      },
      required: ['query', 'finders', 'results', 'referrals'],
      type: 'object',
    },
  },
  'you-finance': {
    inputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        input: {
          description:
            'The finance research question requiring in-depth investigation of financial data, SEC filings, earnings, and company metrics.',
          maxLength: 40000,
          minLength: 1,
          type: 'string',
        },
        research_effort: {
          default: 'deep',
          description:
            'Controls how much time and effort the Finance Research API spends on your question. deep: thorough (default), exhaustive: most comprehensive.',
          enum: ['deep', 'exhaustive'],
          type: 'string',
        },
      },
      required: ['input'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
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
              description: 'List of sources used to generate the answer',
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
  'you-research': {
    inputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        background: {
          default: false,
          description:
            'When true, queue a research task and return a task handle immediately instead of waiting for the result inline. Defaults to synchronous.',
          type: 'boolean',
        },
        input: {
          description:
            'The research question or complex query requiring in-depth investigation and multi-step reasoning. Maximum length: 40,000 characters.',
          maxLength: 40000,
          minLength: 1,
          type: 'string',
        },
        output_schema: {
          additionalProperties: {},
          description:
            'Beta. Requests structured JSON output in output.content using a supported JSON Schema subset. Supported only with research_effort standard, deep, exhaustive, and frontier. Sending with lite returns 422.',
          propertyNames: {
            type: 'string',
          },
          type: 'object',
        },
        research_effort: {
          default: 'standard',
          description:
            'Controls how much time and effort the Research API spends on your question. lite: fast answers, standard: balanced (default), deep: thorough, exhaustive: most comprehensive, frontier: long-running deep research.',
          enum: ['lite', 'standard', 'deep', 'exhaustive', 'frontier'],
          type: 'string',
        },
        source_control: {
          anyOf: [
            {
              properties: {
                boost_domains: {
                  description: 'Must be omitted when include_domains is set.',
                  items: {
                    type: 'string',
                  },
                  maxItems: 0,
                  type: 'array',
                },
                country: {
                  description: 'ISO 3166-1 alpha-2 country code to geographically focus web results.',
                  type: 'string',
                },
                exclude_domains: {
                  description: 'Must be omitted when include_domains is set.',
                  items: {
                    type: 'string',
                  },
                  maxItems: 0,
                  type: 'array',
                },
                freshness: {
                  description: 'Filter results by recency: day, week, month, year, or YYYY-MM-DDtoYYYY-MM-DD.',
                  type: 'string',
                },
                include_domains: {
                  description:
                    'Only return results from these domains. Max 500. Cannot be used with exclude_domains or boost_domains.',
                  items: {
                    type: 'string',
                  },
                  maxItems: 500,
                  type: 'array',
                },
              },
              required: ['include_domains'],
              type: 'object',
            },
            {
              properties: {
                boost_domains: {
                  description:
                    'Boost results from these domains without excluding other domains. Max 500. Cannot be used with include_domains.',
                  items: {
                    type: 'string',
                  },
                  maxItems: 500,
                  type: 'array',
                },
                country: {
                  description: 'ISO 3166-1 alpha-2 country code to geographically focus web results.',
                  type: 'string',
                },
                exclude_domains: {
                  description:
                    'Never return results from these domains. Max 500. Also blocks the research agent from visiting pages on those domains.',
                  items: {
                    type: 'string',
                  },
                  maxItems: 500,
                  type: 'array',
                },
                freshness: {
                  description: 'Filter results by recency: day, week, month, year, or YYYY-MM-DDtoYYYY-MM-DD.',
                  type: 'string',
                },
                include_domains: {
                  description: 'Must be omitted when exclude_domains or boost_domains is set.',
                  items: {
                    type: 'string',
                  },
                  maxItems: 0,
                  type: 'array',
                },
              },
              type: 'object',
            },
          ],
          description:
            'Beta. Controls which web sources the research agent searches and visits. include_domains and exclude_domains cannot be used together.',
        },
      },
      required: ['input'],
      type: 'object',
    },
    outputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        created_at: {
          description: 'When the task was created, in RFC 3339 format',
          type: 'string',
        },
        output: {
          additionalProperties: false,
          description: 'The research output containing the answer and sources',
          properties: {
            content: {
              anyOf: [
                {
                  type: 'string',
                },
                {
                  additionalProperties: {},
                  propertyNames: {
                    type: 'string',
                  },
                  type: 'object',
                },
              ],
              description:
                'Comprehensive response with inline citations. When content_type is "text", this is a Markdown string with numbered citations. When content_type is "object", this is a structured JSON object matching the requested output_schema.',
            },
            content_type: {
              description: 'The format of the content field',
              enum: ['text', 'object'],
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
        status: {
          description: 'The current status of the background research task',
          enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
          type: 'string',
        },
        stream_url: {
          description: 'The URL path for the Server-Sent Events stream for this task',
          type: 'string',
        },
        task_id: {
          description: 'Unique identifier for the background research task',
          type: 'string',
        },
        type: {
          const: 'research',
          description: 'The task type',
          type: 'string',
        },
        warnings: {
          description: 'Warnings generated during research',
          items: {
            type: 'string',
          },
          type: 'array',
        },
      },
      type: 'object',
    },
  },
  'you-search': {
    inputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        boost_domains: {
          description:
            'Domains to boost in search ranking (up to 500). Can combine with exclude_domains, but cannot combine with include_domains.',
          items: {
            type: 'string',
          },
          maxItems: 500,
          type: 'array',
        },
        count: {
          default: 10,
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
          default: 10,
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
        extraction: {
          additionalProperties: false,
          description:
            'Ask for content to be extracted from each result. Omit for a plain search that returns snippets only.',
          properties: {
            extraction_mode: {
              description:
                'Which kind of extraction to run. "highlights" returns query-relevant passages; "full_page" crawls each result.',
              enum: ['highlights', 'full_page'],
              type: 'string',
            },
            full_page: {
              additionalProperties: false,
              description: 'Tuning for extraction_mode: "full_page"',
              properties: {
                extraction_formats: {
                  description: 'Content formats to return, one or both of "markdown" and "html"',
                  items: {
                    enum: ['html', 'markdown'],
                    type: 'string',
                  },
                  type: 'array',
                },
              },
              type: 'object',
            },
          },
          required: ['extraction_mode'],
          type: 'object',
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
          default: 'EN',
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
        offset: {
          description: 'Pagination offset',
          maximum: 9,
          minimum: 0,
          type: 'integer',
        },
        query: {
          description:
            'Concise keyword query, 3–6 words. ALLOWED search operators: `"exact phrase"`, `intitle:term`, `inbody:term`, `-term`, `+term`, and `AND`/`OR` (MUST be uppercase; never mix `AND` with `OR`). DO NOT use `site:`, `lang:`, `loc:`, `filetype:`, `ext:`, `inpage:`, or `NOT`. For domain, language, country, or recency filtering you MUST use the tool\'s other input parameters.',
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
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        metadata: {
          additionalProperties: false,
          properties: {
            latency: {
              description: 'Search latency in seconds',
              type: 'number',
            },
            query: {
              description: 'The search query that was submitted',
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
                    description: 'Extracted page content',
                    properties: {
                      html: {
                        description: 'Full HTML content',
                        type: 'string',
                      },
                      markdown: {
                        description: 'Full Markdown content',
                        type: 'string',
                      },
                      metadata: {
                        additionalProperties: false,
                        description: 'JSON-LD and OpenGraph metadata about the page',
                        properties: {
                          favicon_url: {
                            description: 'Favicon URL of the page domain',
                            type: 'string',
                          },
                          site_name: {
                            description: 'OpenGraph site name of the page',
                            type: 'string',
                          },
                        },
                        type: 'object',
                      },
                    },
                    type: 'object',
                  },
                  description: {
                    description: 'Short description of the news result',
                    type: 'string',
                  },
                  page_age: {
                    description: 'Publication date of the article',
                    type: 'string',
                  },
                  thumbnail_url: {
                    description: 'Thumbnail image URL',
                    type: 'string',
                  },
                  title: {
                    description: 'Title of the news result',
                    type: 'string',
                  },
                  url: {
                    description: 'URL of the news result',
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
                  contents: {
                    additionalProperties: false,
                    description: 'Extracted page content',
                    properties: {
                      highlights: {
                        description: 'Query-relevant passages from the page',
                        items: {
                          type: 'string',
                        },
                        type: 'array',
                      },
                      html: {
                        description: 'Full HTML content',
                        type: 'string',
                      },
                      markdown: {
                        description: 'Full Markdown content',
                        type: 'string',
                      },
                      metadata: {
                        additionalProperties: false,
                        description: 'JSON-LD and OpenGraph metadata about the page',
                        properties: {
                          favicon_url: {
                            description: 'Favicon URL of the page domain',
                            type: 'string',
                          },
                          site_name: {
                            description: 'OpenGraph site name of the page',
                            type: 'string',
                          },
                        },
                        type: 'object',
                      },
                    },
                    type: 'object',
                  },
                  description: {
                    description: 'Short description of the search result',
                    type: 'string',
                  },
                  favicon_url: {
                    description: 'Favicon URL',
                    type: 'string',
                  },
                  page_age: {
                    description: 'Publication date of the page',
                    type: 'string',
                  },
                  snippets: {
                    description: 'Query-relevant text excerpts from the page',
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
                    description: 'Title of the search result',
                    type: 'string',
                  },
                  url: {
                    description: 'URL of the search result',
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

export type YouAnswerInput = {
  boost_domains?: Array<string>
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
  exclude_domains?: Array<string>
  freshness?: string
  include_domains?: Array<string>
  language?:
    | 'AR'
    | 'EU'
    | 'BN'
    | 'BG'
    | 'CA'
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
    | 'KN'
    | 'KO'
    | 'LV'
    | 'LT'
    | 'MS'
    | 'ML'
    | 'MR'
    | 'NB'
    | 'PL'
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
  query: string
}

export type YouAnswerOutput = {
  answer: string
  citations: Array<{
    excerpts: Array<string>
    source: string
  }>
  results: {
    web: Array<{
      page_age?: string
      snippets?: Array<string>
      title: string
      url: string
    }>
  }
}

export type YouContentsInput = {
  crawl_timeout?: number
  formats?: Array<'markdown' | 'html' | 'metadata'>
  max_age?: number | null
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

export type YouDiscoverInput = {
  finder?: 'github' | 'huggingface' | 'all'
  finder_url?: string
  limit?: number
  query: string
}

export type YouDiscoverOutput = {
  finders: {
    failed: Array<string>
    queried: Array<string>
    responded: Array<string>
  }
  query: string
  referrals: Array<{
    identifier: string
    type: string
    url: string
    [key: string]: Record<string, unknown> | string
  }>
  results: Array<{
    description?: string
    displayName: string
    identifier: string
    publisher?: string
    resourceKind: 'mcp-server' | 'a2a-agent' | 'skill' | 'api' | 'raw'
    score: number
    sources: Array<string>
    type: string
    url: string
  }>
}

export type YouFinanceInput = {
  input: string
  research_effort?: 'deep' | 'exhaustive'
}

export type YouFinanceOutput = {
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

export type YouResearchInput = {
  background?: boolean
  input: string
  output_schema?: {
    [key: string]: Record<string, unknown>
  }
  research_effort?: 'lite' | 'standard' | 'deep' | 'exhaustive' | 'frontier'
  source_control?:
    | {
        boost_domains?: Array<string>
        country?: string
        exclude_domains?: Array<string>
        freshness?: string
        include_domains: Array<string>
      }
    | {
        boost_domains?: Array<string>
        country?: string
        exclude_domains?: Array<string>
        freshness?: string
        include_domains?: Array<string>
      }
}

export type YouResearchOutput = {
  created_at?: string
  output?: {
    content:
      | string
      | {
          [key: string]: Record<string, unknown>
        }
    content_type: 'text' | 'object'
    sources: Array<{
      snippets?: Array<string>
      title?: string
      url: string
    }>
  }
  status?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  stream_url?: string
  task_id?: string
  type?: 'research'
  warnings?: Array<string>
}

export type YouSearchInput = {
  boost_domains?: Array<string>
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
  extraction?: {
    extraction_mode: 'highlights' | 'full_page'
    full_page?: {
      extraction_formats?: Array<'html' | 'markdown'>
    }
  }
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
        metadata?: {
          favicon_url?: string
          site_name?: string
        }
      }
      description?: string
      page_age?: string
      thumbnail_url?: string
      title?: string
      url?: string
    }>
    web?: Array<{
      contents?: {
        highlights?: Array<string>
        html?: string
        markdown?: string
        metadata?: {
          favicon_url?: string
          site_name?: string
        }
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
  'you-answer': YouAnswerInput
  'you-contents': YouContentsInput
  'you-discover': YouDiscoverInput
  'you-finance': YouFinanceInput
  'you-research': YouResearchInput
  'you-search': YouSearchInput
}

type KnownToolOutputMap = {
  'you-answer': YouAnswerOutput
  'you-contents': YouContentsOutput
  'you-discover': YouDiscoverOutput
  'you-finance': YouFinanceOutput
  'you-research': YouResearchOutput
  'you-search': YouSearchOutput
}

export type KnownToolInput<T extends KnownToolName> = KnownToolInputMap[T]

export type KnownToolOutput<T extends KnownToolName> = KnownToolOutputMap[T]
