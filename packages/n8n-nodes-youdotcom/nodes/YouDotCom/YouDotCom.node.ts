import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { ZodError } from 'zod';
import {
  ContentsOptionsSchema,
  ContentsResponseSchema,
  ExpressOptionsSchema,
  ExpressResponseSchema,
  SearchOptionsSchema,
  SearchResponseSchema,
} from './YouDotCom.schemas.ts';

/** Package version for User-Agent header */
const PACKAGE_VERSION = '0.1.0';

/** User-Agent string for API requests */
const USER_AGENT = `n8n-nodes-youdotcom/${PACKAGE_VERSION} (https://github.com/youdotcom-oss/dx-toolkit)`;

/**
 * You.com node for n8n - Search, Contents, and Express (AI Agent) operations.
 *
 * NOTE: n8n framework requires class-based nodes that implement INodeType.
 * This is an exception to the project's arrow function convention (see .plaited/rules/core.md).
 */
export class YouDotCom implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'You.com',
    name: 'youDotCom',
    icon: 'file:youdotcom.svg',
    group: ['transform'],
    version: 1,
    usableAsTool: true,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Search the web, extract content from URLs, or get AI-powered answers using You.com APIs',
    defaults: {
      name: 'You.com',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'youDotComApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: 'https://ydc-index.io',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
    },
    properties: [
      // ====================
      // Operation Selection
      // ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Search',
            value: 'search',
            description: 'Search the web and news using You.com',
            action: 'Search the web and news',
          },
          {
            name: 'Get Contents',
            value: 'contents',
            description: 'Extract content from one or more URLs',
            action: 'Extract content from web pages',
          },
          {
            name: 'Express (AI Agent)',
            value: 'express',
            description: 'Get AI-generated answers with web search and citations',
            action: 'Get AI answers with citations',
          },
        ],
        default: 'search',
      },

      // ====================
      // Search Parameters
      // ====================
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            operation: ['search'],
          },
        },
        default: '',
        placeholder: 'e.g., latest AI news',
        description:
          'The search query to retrieve relevant results from the web. Supports search operators for refined searches.',
      },
      {
        displayName: 'Search Options',
        name: 'searchOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          show: {
            operation: ['search'],
          },
        },
        options: [
          {
            displayName: 'Count',
            name: 'count',
            type: 'number',
            typeOptions: {
              minValue: 1,
              maxValue: 100,
            },
            default: 10,
            description: 'Maximum number of search results to return per section (web and news)',
          },
          {
            displayName: 'Country',
            name: 'country',
            type: 'options',
            default: '',
            description: 'Country code that determines the geographical focus of results',
            options: [
              { name: 'Any', value: '' },
              { name: 'Argentina', value: 'AR' },
              { name: 'Australia', value: 'AU' },
              { name: 'Austria', value: 'AT' },
              { name: 'Belgium', value: 'BE' },
              { name: 'Brazil', value: 'BR' },
              { name: 'Canada', value: 'CA' },
              { name: 'Chile', value: 'CL' },
              { name: 'China', value: 'CN' },
              { name: 'Denmark', value: 'DK' },
              { name: 'Finland', value: 'FI' },
              { name: 'France', value: 'FR' },
              { name: 'Germany', value: 'DE' },
              { name: 'Hong Kong', value: 'HK' },
              { name: 'India', value: 'IN' },
              { name: 'Indonesia', value: 'ID' },
              { name: 'Italy', value: 'IT' },
              { name: 'Japan', value: 'JP' },
              { name: 'Malaysia', value: 'MY' },
              { name: 'Mexico', value: 'MX' },
              { name: 'Netherlands', value: 'NL' },
              { name: 'New Zealand', value: 'NZ' },
              { name: 'Norway', value: 'NO' },
              { name: 'Philippines', value: 'PH' },
              { name: 'Poland', value: 'PL' },
              { name: 'Portugal', value: 'PT' },
              { name: 'Russia', value: 'RU' },
              { name: 'Saudi Arabia', value: 'SA' },
              { name: 'South Africa', value: 'ZA' },
              { name: 'South Korea', value: 'KR' },
              { name: 'Spain', value: 'ES' },
              { name: 'Sweden', value: 'SE' },
              { name: 'Switzerland', value: 'CH' },
              { name: 'Taiwan', value: 'TW' },
              { name: 'Turkey', value: 'TR' },
              { name: 'United Kingdom', value: 'GB' },
              { name: 'United States', value: 'US' },
            ],
          },
          {
            displayName: 'Exact Terms',
            name: 'exactTerms',
            type: 'string',
            default: '',
            placeholder: 'e.g., machine learning|AI',
            description: 'Require exact phrase matches (pipe-separated, e.g., "machine learning|deep learning")',
          },
          {
            displayName: 'Exclude Terms',
            name: 'excludeTerms',
            type: 'string',
            default: '',
            placeholder: 'e.g., spam|ads',
            description: 'Terms to exclude from results (pipe-separated, e.g., "spam|ads|promo")',
          },
          {
            displayName: 'File Type',
            name: 'fileType',
            type: 'string',
            default: '',
            placeholder: 'e.g., pdf',
            description: 'Filter results by file type (e.g., pdf, doc, xls)',
          },
          {
            displayName: 'Freshness',
            name: 'freshness',
            type: 'options',
            default: '',
            description: 'Filter results by recency',
            options: [
              { name: 'Any Time', value: '' },
              { name: 'Past Day', value: 'day' },
              { name: 'Past Month', value: 'month' },
              { name: 'Past Week', value: 'week' },
              { name: 'Past Year', value: 'year' },
            ],
          },
          {
            displayName: 'Language',
            name: 'language',
            type: 'options',
            default: 'EN',
            description: 'Language of the web results (BCP 47 format)',
            options: [
              { name: 'Arabic', value: 'AR' },
              { name: 'Bengali', value: 'BN' },
              { name: 'Bulgarian', value: 'BG' },
              { name: 'Catalan', value: 'CA' },
              { name: 'Chinese (Simplified)', value: 'ZH-HANS' },
              { name: 'Chinese (Traditional)', value: 'ZH-HANT' },
              { name: 'Croatian', value: 'HR' },
              { name: 'Czech', value: 'CS' },
              { name: 'Danish', value: 'DA' },
              { name: 'Dutch', value: 'NL' },
              { name: 'English', value: 'EN' },
              { name: 'English (UK)', value: 'EN-GB' },
              { name: 'Estonian', value: 'ET' },
              { name: 'Finnish', value: 'FI' },
              { name: 'French', value: 'FR' },
              { name: 'Galician', value: 'GL' },
              { name: 'German', value: 'DE' },
              { name: 'Greek', value: 'EL' },
              { name: 'Gujarati', value: 'GU' },
              { name: 'Hebrew', value: 'HE' },
              { name: 'Hindi', value: 'HI' },
              { name: 'Hungarian', value: 'HU' },
              { name: 'Icelandic', value: 'IS' },
              { name: 'Italian', value: 'IT' },
              { name: 'Japanese', value: 'JP' },
              { name: 'Kannada', value: 'KN' },
              { name: 'Korean', value: 'KO' },
              { name: 'Latvian', value: 'LV' },
              { name: 'Lithuanian', value: 'LT' },
              { name: 'Malay', value: 'MS' },
              { name: 'Malayalam', value: 'ML' },
              { name: 'Marathi', value: 'MR' },
              { name: 'Norwegian', value: 'NB' },
              { name: 'Polish', value: 'PL' },
              { name: 'Portuguese (Brazil)', value: 'PT-BR' },
              { name: 'Portuguese (Portugal)', value: 'PT-PT' },
              { name: 'Punjabi', value: 'PA' },
              { name: 'Romanian', value: 'RO' },
              { name: 'Russian', value: 'RU' },
              { name: 'Serbian', value: 'SR' },
              { name: 'Slovak', value: 'SK' },
              { name: 'Slovenian', value: 'SL' },
              { name: 'Spanish', value: 'ES' },
              { name: 'Swedish', value: 'SV' },
              { name: 'Tamil', value: 'TA' },
              { name: 'Telugu', value: 'TE' },
              { name: 'Thai', value: 'TH' },
              { name: 'Turkish', value: 'TR' },
              { name: 'Ukrainian', value: 'UK' },
              { name: 'Vietnamese', value: 'VI' },
            ],
          },
          {
            displayName: 'Livecrawl',
            name: 'livecrawl',
            type: 'options',
            default: '',
            description: 'Fetch and return full page content for search results',
            options: [
              { name: 'None', value: '' },
              { name: 'Web Results Only', value: 'web' },
              { name: 'News Results Only', value: 'news' },
              { name: 'All Results', value: 'all' },
            ],
          },
          {
            displayName: 'Livecrawl Format',
            name: 'livecrawl_formats',
            type: 'options',
            default: 'markdown',
            description: 'Format for livecrawled content',
            displayOptions: {
              show: {
                livecrawl: ['web', 'news', 'all'],
              },
            },
            options: [
              { name: 'HTML', value: 'html' },
              { name: 'Markdown', value: 'markdown' },
            ],
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 9,
            },
            default: 0,
            description:
              'Pagination offset. Calculated in multiples of count. For example, if count=5 and offset=1, results 5-10 are returned.',
          },
          {
            displayName: 'Safe Search',
            name: 'safesearch',
            type: 'options',
            default: 'moderate',
            description: 'Content moderation filter level',
            options: [
              { name: 'Off', value: 'off' },
              { name: 'Moderate', value: 'moderate' },
              { name: 'Strict', value: 'strict' },
            ],
          },
          {
            displayName: 'Site',
            name: 'site',
            type: 'string',
            default: '',
            placeholder: 'e.g., github.com',
            description: 'Restrict results to a specific domain (e.g., github.com)',
          },
        ],
      },

      // ====================
      // Contents Parameters
      // ====================
      {
        displayName: 'URLs',
        name: 'urls',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            operation: ['contents'],
          },
        },
        default: '',
        placeholder: 'https://example.com, https://example.org',
        description: 'Comma-separated list of URLs to extract content from',
      },
      {
        displayName: 'Contents Options',
        name: 'contentsOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          show: {
            operation: ['contents'],
          },
        },
        options: [
          {
            displayName: 'Formats',
            name: 'formats',
            type: 'multiOptions',
            default: ['markdown'],
            description: 'Output formats to return for each URL',
            options: [
              {
                name: 'Markdown',
                value: 'markdown',
                description: 'Clean text content in Markdown format',
              },
              {
                name: 'HTML',
                value: 'html',
                description: 'Full HTML content with layout preserved',
              },
              {
                name: 'Metadata',
                value: 'metadata',
                description: 'Structured metadata (JSON-LD, OpenGraph, Twitter Cards)',
              },
            ],
          },
          {
            displayName: 'Crawl Timeout',
            name: 'crawl_timeout',
            type: 'number',
            typeOptions: {
              minValue: 1,
              maxValue: 60,
            },
            default: 30,
            description: 'Timeout in seconds for page crawling (1-60)',
          },
        ],
      },

      // ====================
      // Express Parameters
      // ====================
      {
        displayName: 'Input',
        name: 'input',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            operation: ['express'],
          },
        },
        default: '',
        placeholder: 'e.g., What are the latest developments in AI?',
        description: 'Question or prompt for the AI agent to answer',
      },
      {
        displayName: 'Express Options',
        name: 'expressOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          show: {
            operation: ['express'],
          },
        },
        options: [
          {
            displayName: 'Enable Web Search',
            name: 'enableWebSearch',
            type: 'boolean',
            default: true,
            description: 'Whether the AI agent should search the web for current information',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i);

        if (operation === 'search') {
          const response = await YouDotCom.#executeSearch(this, i);
          const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), {
            itemData: { item: i },
          });
          returnData.push(...executionData);
        } else if (operation === 'contents') {
          const response = await YouDotCom.#executeContents(this, i);
          const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), {
            itemData: { item: i },
          });
          returnData.push(...executionData);
        } else if (operation === 'express') {
          const response = await YouDotCom.#executeExpress(this, i);
          const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), {
            itemData: { item: i },
          });
          returnData.push(...executionData);
        }
      } catch (error) {
        // Handle Zod validation errors with detailed messages
        if (error instanceof ZodError) {
          const errorMessage = `Validation error:\n${error.issues.map((e, i) => `  ${i + 1}. ${e.path.join('.') || 'root'}: ${e.message}`).join('\n')}`;
          const serializedIssues = error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }));

          if (this.continueOnFail()) {
            returnData.push({
              json: {
                error: errorMessage,
                validationErrors: serializedIssues,
              },
              pairedItem: { item: i },
            });
            continue;
          }
          throw new NodeApiError(this.getNode(), { message: errorMessage, issues: serializedIssues } as JsonObject, {
            itemIndex: i,
          });
        }

        // Handle other errors
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeApiError(this.getNode(), error as JsonObject, {
          itemIndex: i,
        });
      }
    }

    return [returnData];
  }

  /**
   * Execute Search operation
   *
   * @param context - n8n execution context with helper methods
   * @param itemIndex - Index of the current item being processed
   * @returns Search results from You.com API
   */
  static async #executeSearch(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const query = context.getNodeParameter('query', itemIndex) as string;
    const rawOptions = context.getNodeParameter('searchOptions', itemIndex);

    // Validate options with Zod schema
    const options = SearchOptionsSchema.parse(rawOptions);

    const qs: Record<string, string | number> = { query };

    if (options.count) qs.count = options.count;
    if (options.country) qs.country = options.country;
    if (options.freshness) qs.freshness = options.freshness;
    if (options.language) qs.language = options.language;
    if (options.livecrawl) qs.livecrawl = options.livecrawl;
    if (options.livecrawl_formats) qs.livecrawl_formats = options.livecrawl_formats;
    if (options.offset !== undefined) qs.offset = options.offset;
    if (options.safesearch) qs.safesearch = options.safesearch;
    if (options.site) qs.site = options.site;
    if (options.fileType) qs.fileType = options.fileType;
    if (options.excludeTerms) qs.excludeTerms = options.excludeTerms;
    if (options.exactTerms) qs.exactTerms = options.exactTerms;

    const rawResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'youDotComApi', {
      method: 'GET',
      url: 'https://ydc-index.io/v1/search',
      headers: {
        'User-Agent': USER_AGENT,
      },
      qs,
      json: true,
    });

    // Validate API response with Zod schema
    const response = SearchResponseSchema.parse(rawResponse);

    return response as IDataObject;
  }

  /**
   * Execute Contents operation
   *
   * @param context - n8n execution context with helper methods
   * @param itemIndex - Index of the current item being processed
   * @returns Content extracted from URLs
   */
  static async #executeContents(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
    const urlsString = context.getNodeParameter('urls', itemIndex) as string;
    const rawOptions = context.getNodeParameter('contentsOptions', itemIndex);

    // Validate options with Zod schema
    const options = ContentsOptionsSchema.parse(rawOptions);

    // Parse comma-separated URLs and trim whitespace
    const urls = urlsString
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      throw new NodeOperationError(context.getNode(), 'At least one URL is required', { itemIndex });
    }

    // Build request body
    const body: Record<string, unknown> = { urls };

    if (options.formats && options.formats.length > 0) {
      body.formats = options.formats;
    }
    if (options.crawl_timeout) {
      body.crawl_timeout = options.crawl_timeout;
    }

    const rawResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'youDotComApi', {
      method: 'POST',
      url: 'https://ydc-index.io/v1/contents',
      headers: {
        'User-Agent': USER_AGENT,
      },
      body,
      json: true,
    });

    // Validate API response with Zod schema
    const response = ContentsResponseSchema.parse(rawResponse);

    return response as IDataObject[];
  }

  /**
   * Execute Express (AI Agent) operation
   *
   * @remarks
   * Express API uses a different endpoint (api.you.com) and Bearer auth,
   * unlike Search/Contents which use ydc-index.io with X-API-Key header.
   *
   * @param context - n8n execution context with helper methods
   * @param itemIndex - Index of the current item being processed
   * @returns AI-generated answer with optional search results
   */
  static async #executeExpress(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const input = context.getNodeParameter('input', itemIndex) as string;
    const rawOptions = context.getNodeParameter('expressOptions', itemIndex);

    // Validate options with Zod schema
    const options = ExpressOptionsSchema.parse(rawOptions);

    // Get credentials to extract API key for Bearer auth
    const credentials = await context.getCredentials('youDotComApi');
    const apiKey = credentials.apiKey as string;

    // Build request body - Express API requires specific format
    const body: Record<string, unknown> = {
      agent: 'express',
      input,
      stream: false,
    };

    // Add web search tool if enabled (default: true)
    if (options.enableWebSearch !== false) {
      body.tools = [{ type: 'web_search' }];
    }

    // Express API uses Bearer auth and different endpoint
    const rawResponse = await context.helpers.httpRequest({
      method: 'POST',
      url: 'https://api.you.com/v1/agents/runs',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      body,
      json: true,
    });

    // Validate API response with Zod schema
    const response = ExpressResponseSchema.parse(rawResponse);

    // Transform response to a more user-friendly format
    const result: IDataObject = {
      agent: response.agent,
    };

    // Extract answer and search results from output array
    if (response.output) {
      for (const item of response.output) {
        if (item.type === 'message.answer' && item.text) {
          result.answer = item.text;
        } else if (item.type === 'web_search.results' && item.content) {
          result.searchResults = item.content;
        }
      }
    }

    return result;
  }
}
