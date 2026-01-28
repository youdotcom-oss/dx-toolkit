import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * You.com Search node for n8n.
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
    subtitle: '={{$parameter["operation"]}}',
    description: 'Search the web using You.com Search API',
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
      baseURL: 'https://api.ydc-index.io',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
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
        ],
        default: 'search',
      },
      // Search operation parameters
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
        displayName: 'Options',
        name: 'options',
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
          {
            displayName: 'File Type',
            name: 'fileType',
            type: 'string',
            default: '',
            placeholder: 'e.g., pdf',
            description: 'Filter results by file type (e.g., pdf, doc, xls)',
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
            displayName: 'Exact Terms',
            name: 'exactTerms',
            type: 'string',
            default: '',
            placeholder: 'e.g., machine learning|AI',
            description: 'Require exact phrase matches (pipe-separated, e.g., "machine learning|deep learning")',
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
        const operation = this.getNodeParameter('operation', i) as string;

        if (operation === 'search') {
          const query = this.getNodeParameter('query', i) as string;
          const options = this.getNodeParameter('options', i) as {
            count?: number;
            country?: string;
            excludeTerms?: string;
            exactTerms?: string;
            fileType?: string;
            freshness?: string;
            language?: string;
            livecrawl?: string;
            livecrawl_formats?: string;
            offset?: number;
            safesearch?: string;
            site?: string;
          };

          // Build query parameters
          const qs: Record<string, string | number> = {
            query,
          };

          if (options.count) {
            qs.count = options.count;
          }
          if (options.country) {
            qs.country = options.country;
          }
          if (options.freshness) {
            qs.freshness = options.freshness;
          }
          if (options.language) {
            qs.language = options.language;
          }
          if (options.livecrawl) {
            qs.livecrawl = options.livecrawl;
          }
          if (options.livecrawl_formats) {
            qs.livecrawl_formats = options.livecrawl_formats;
          }
          if (options.offset !== undefined) {
            qs.offset = options.offset;
          }
          if (options.safesearch) {
            qs.safesearch = options.safesearch;
          }
          if (options.site) {
            qs.site = options.site;
          }
          if (options.fileType) {
            qs.fileType = options.fileType;
          }
          if (options.excludeTerms) {
            qs.excludeTerms = options.excludeTerms;
          }
          if (options.exactTerms) {
            qs.exactTerms = options.exactTerms;
          }

          const response = await this.helpers.httpRequestWithAuthentication.call(this, 'youDotComApi', {
            method: 'GET' as IHttpRequestMethods,
            url: 'https://api.ydc-index.io/v1/search',
            qs,
            json: true,
          });

          // Return the full response with web and news results
          const executionData = this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray(response as IDataObject),
            { itemData: { item: i } },
          );
          returnData.push(...executionData);
        }
      } catch (error) {
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
}
