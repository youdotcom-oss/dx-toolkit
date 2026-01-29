import { beforeAll, describe, expect, test } from 'bun:test';
import type { INodePropertyOptions } from 'n8n-workflow';
import { YouDotCom, YouDotComApi } from '../src/main.ts';

/**
 * Unit tests for n8n YouDotCom node
 *
 * Test Strategy:
 * - Node description validation: Verify node metadata and configuration
 * - Credentials validation: Verify credential configuration
 * - Parameter validation: Verify all parameters for Search, Contents, and Express operations
 *
 * Note: Integration tests requiring actual n8n execution context are not included
 * as they would require spinning up an n8n instance. The underlying API functionality
 * is tested in the @youdotcom-oss/mcp package.
 */

/** Helper type for n8n property with options */
interface PropertyWithOptions {
  name: string;
  displayName: string;
  type: string;
  options?: INodePropertyOptions[];
  typeOptions?: { minValue?: number; maxValue?: number; password?: boolean };
  displayOptions?: { show?: Record<string, string[]> };
  required?: boolean;
}

describe('YouDotCom Node', () => {
  let node: YouDotCom;

  beforeAll(() => {
    node = new YouDotCom();
  });

  describe('Node Description', () => {
    test('has correct display name', () => {
      expect(node.description.displayName).toBe('You.com');
    });

    test('has correct internal name', () => {
      expect(node.description.name).toBe('youDotCom');
    });

    test('has icon configured', () => {
      expect(node.description.icon).toBe('file:youdotcom.svg');
    });

    test('has correct version', () => {
      expect(node.description.version).toBe(1);
    });

    test('has main inputs and outputs', () => {
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    test('requires youDotComApi credentials', () => {
      const credentials = node.description.credentials;
      expect(credentials).toBeDefined();
      expect(credentials?.length).toBe(1);
      expect(credentials?.[0]?.name).toBe('youDotComApi');
      expect(credentials?.[0]?.required).toBe(true);
    });

    test('has correct base URL in request defaults', () => {
      expect(node.description.requestDefaults?.baseURL).toBe('https://ydc-index.io');
    });

    test('has User-Agent header in request defaults', () => {
      const headers = node.description.requestDefaults?.headers as Record<string, string> | undefined;
      expect(headers?.['User-Agent']).toMatch(/^n8n-nodes-youdotcom\/\d+\.\d+\.\d+/);
    });

    test('has updated description mentioning all operations', () => {
      const desc = node.description.description?.toLowerCase() ?? '';
      expect(desc).toContain('search');
      expect(desc).toContain('content');
      expect(desc).toContain('ai');
    });
  });

  describe('Operations', () => {
    const getOperationProperty = () => {
      return node.description.properties.find((p) => p.name === 'operation') as PropertyWithOptions | undefined;
    };

    test('has search operation', () => {
      const operationProperty = getOperationProperty();
      expect(operationProperty).toBeDefined();
      expect(operationProperty?.type).toBe('options');

      const searchOption = operationProperty?.options?.find((o) => o.value === 'search');
      expect(searchOption).toBeDefined();
      expect(searchOption?.name).toBe('Search');
      expect((searchOption as INodePropertyOptions & { action?: string })?.action).toBe('Search the web and news');
    });

    test('has contents operation', () => {
      const operationProperty = getOperationProperty();
      const contentsOption = operationProperty?.options?.find((o) => o.value === 'contents');
      expect(contentsOption).toBeDefined();
      expect(contentsOption?.name).toBe('Get Contents');
      expect((contentsOption as INodePropertyOptions & { action?: string })?.action).toBe(
        'Extract content from web pages',
      );
    });

    test('has express operation', () => {
      const operationProperty = getOperationProperty();
      const expressOption = operationProperty?.options?.find((o) => o.value === 'express');
      expect(expressOption).toBeDefined();
      expect(expressOption?.name).toBe('Express (AI Agent)');
      expect((expressOption as INodePropertyOptions & { action?: string })?.action).toBe(
        'Get AI answers with citations',
      );
    });

    test('has exactly three operations', () => {
      const operationProperty = getOperationProperty();
      expect(operationProperty?.options?.length).toBe(3);
    });
  });

  describe('Search Parameters', () => {
    const getSearchOptionsProperty = (): PropertyWithOptions | undefined => {
      return node.description.properties.find((p) => p.name === 'searchOptions') as PropertyWithOptions | undefined;
    };

    const getSearchOption = (displayName: string): PropertyWithOptions | undefined => {
      const optionsProperty = getSearchOptionsProperty();
      const options = optionsProperty?.options as unknown as PropertyWithOptions[] | undefined;
      return options?.find((o) => o.displayName === displayName);
    };

    test('has query parameter as required', () => {
      const queryProperty = node.description.properties.find((p) => p.name === 'query');
      expect(queryProperty).toBeDefined();
      expect(queryProperty?.required).toBe(true);
      expect(queryProperty?.type).toBe('string');
    });

    test('has searchOptions collection', () => {
      const optionsProperty = getSearchOptionsProperty();
      expect(optionsProperty).toBeDefined();
      expect(optionsProperty?.type).toBe('collection');
    });

    test('has count option with correct constraints', () => {
      const countOption = getSearchOption('Count');
      expect(countOption).toBeDefined();
      expect(countOption?.type).toBe('number');
      expect(countOption?.typeOptions?.minValue).toBe(1);
      expect(countOption?.typeOptions?.maxValue).toBe(100);
    });

    test('has country option with supported countries', () => {
      const countryOption = getSearchOption('Country');
      expect(countryOption).toBeDefined();
      expect(countryOption?.type).toBe('options');

      const countryValues = countryOption?.options?.map((o) => o.value);
      expect(countryValues).toContain('US');
      expect(countryValues).toContain('GB');
      expect(countryValues).toContain('DE');
      expect(countryValues).toContain('FR');
      expect(countryValues).toContain('JP');
    });

    test('has freshness option with time ranges', () => {
      const freshnessOption = getSearchOption('Freshness');
      expect(freshnessOption).toBeDefined();
      expect(freshnessOption?.type).toBe('options');

      const freshnessValues = freshnessOption?.options?.map((o) => o.value);
      expect(freshnessValues).toContain('day');
      expect(freshnessValues).toContain('week');
      expect(freshnessValues).toContain('month');
      expect(freshnessValues).toContain('year');
    });

    test('has language option with BCP 47 codes', () => {
      const languageOption = getSearchOption('Language');
      expect(languageOption).toBeDefined();
      expect(languageOption?.type).toBe('options');

      const languageValues = languageOption?.options?.map((o) => o.value);
      expect(languageValues).toContain('EN');
      expect(languageValues).toContain('DE');
      expect(languageValues).toContain('FR');
      expect(languageValues).toContain('JP');
    });

    test('has livecrawl option', () => {
      const livecrawlOption = getSearchOption('Livecrawl');
      expect(livecrawlOption).toBeDefined();
      expect(livecrawlOption?.type).toBe('options');

      const livecrawlValues = livecrawlOption?.options?.map((o) => o.value);
      expect(livecrawlValues).toContain('web');
      expect(livecrawlValues).toContain('news');
      expect(livecrawlValues).toContain('all');
    });

    test('has livecrawl format option with conditional display', () => {
      const formatOption = getSearchOption('Livecrawl Format');
      expect(formatOption).toBeDefined();
      expect(formatOption?.type).toBe('options');
      expect(formatOption?.displayOptions?.show?.livecrawl).toEqual(['web', 'news', 'all']);

      const formatValues = formatOption?.options?.map((o) => o.value);
      expect(formatValues).toContain('html');
      expect(formatValues).toContain('markdown');
    });

    test('has offset option with correct constraints', () => {
      const offsetOption = getSearchOption('Offset');
      expect(offsetOption).toBeDefined();
      expect(offsetOption?.type).toBe('number');
      expect(offsetOption?.typeOptions?.minValue).toBe(0);
      expect(offsetOption?.typeOptions?.maxValue).toBe(9);
    });

    test('has safesearch option', () => {
      const safesearchOption = getSearchOption('Safe Search');
      expect(safesearchOption).toBeDefined();
      expect(safesearchOption?.type).toBe('options');

      const safesearchValues = safesearchOption?.options?.map((o) => o.value);
      expect(safesearchValues).toContain('off');
      expect(safesearchValues).toContain('moderate');
      expect(safesearchValues).toContain('strict');
    });

    test('has site option', () => {
      const siteOption = getSearchOption('Site');
      expect(siteOption).toBeDefined();
      expect(siteOption?.type).toBe('string');
    });

    test('has fileType option', () => {
      const fileTypeOption = getSearchOption('File Type');
      expect(fileTypeOption).toBeDefined();
      expect(fileTypeOption?.type).toBe('string');
    });

    test('has excludeTerms option', () => {
      const excludeTermsOption = getSearchOption('Exclude Terms');
      expect(excludeTermsOption).toBeDefined();
      expect(excludeTermsOption?.type).toBe('string');
    });

    test('has exactTerms option', () => {
      const exactTermsOption = getSearchOption('Exact Terms');
      expect(exactTermsOption).toBeDefined();
      expect(exactTermsOption?.type).toBe('string');
    });
  });

  describe('Contents Parameters', () => {
    const getContentsOptionsProperty = (): PropertyWithOptions | undefined => {
      return node.description.properties.find((p) => p.name === 'contentsOptions') as PropertyWithOptions | undefined;
    };

    const getContentsOption = (displayName: string): PropertyWithOptions | undefined => {
      const optionsProperty = getContentsOptionsProperty();
      const options = optionsProperty?.options as unknown as PropertyWithOptions[] | undefined;
      return options?.find((o) => o.displayName === displayName);
    };

    test('has urls parameter as required', () => {
      const urlsProperty = node.description.properties.find((p) => p.name === 'urls');
      expect(urlsProperty).toBeDefined();
      expect(urlsProperty?.required).toBe(true);
      expect(urlsProperty?.type).toBe('string');
    });

    test('urls parameter is only shown for contents operation', () => {
      const urlsProperty = node.description.properties.find((p) => p.name === 'urls');
      expect(urlsProperty?.displayOptions?.show?.operation).toEqual(['contents']);
    });

    test('has contentsOptions collection', () => {
      const optionsProperty = getContentsOptionsProperty();
      expect(optionsProperty).toBeDefined();
      expect(optionsProperty?.type).toBe('collection');
    });

    test('has formats option with multiOptions type', () => {
      const formatsOption = getContentsOption('Formats');
      expect(formatsOption).toBeDefined();
      expect(formatsOption?.type).toBe('multiOptions');

      const formatValues = formatsOption?.options?.map((o) => o.value);
      expect(formatValues).toContain('markdown');
      expect(formatValues).toContain('html');
      expect(formatValues).toContain('metadata');
    });

    test('has crawl timeout option with correct constraints', () => {
      const timeoutOption = getContentsOption('Crawl Timeout');
      expect(timeoutOption).toBeDefined();
      expect(timeoutOption?.type).toBe('number');
      expect(timeoutOption?.typeOptions?.minValue).toBe(1);
      expect(timeoutOption?.typeOptions?.maxValue).toBe(60);
    });
  });

  describe('Express Parameters', () => {
    const getExpressOptionsProperty = (): PropertyWithOptions | undefined => {
      return node.description.properties.find((p) => p.name === 'expressOptions') as PropertyWithOptions | undefined;
    };

    const getExpressOption = (displayName: string): PropertyWithOptions | undefined => {
      const optionsProperty = getExpressOptionsProperty();
      const options = optionsProperty?.options as unknown as PropertyWithOptions[] | undefined;
      return options?.find((o) => o.displayName === displayName);
    };

    test('has input parameter as required', () => {
      const inputProperty = node.description.properties.find((p) => p.name === 'input');
      expect(inputProperty).toBeDefined();
      expect(inputProperty?.required).toBe(true);
      expect(inputProperty?.type).toBe('string');
    });

    test('input parameter is only shown for express operation', () => {
      const inputProperty = node.description.properties.find((p) => p.name === 'input');
      expect(inputProperty?.displayOptions?.show?.operation).toEqual(['express']);
    });

    test('has expressOptions collection', () => {
      const optionsProperty = getExpressOptionsProperty();
      expect(optionsProperty).toBeDefined();
      expect(optionsProperty?.type).toBe('collection');
    });

    test('has enableWebSearch option as boolean', () => {
      const webSearchOption = getExpressOption('Enable Web Search');
      expect(webSearchOption).toBeDefined();
      expect(webSearchOption?.type).toBe('boolean');
    });
  });

  describe('Execute Method', () => {
    test('has execute method', () => {
      expect(typeof node.execute).toBe('function');
    });
  });
});

describe('YouDotComApi Credentials', () => {
  let credentials: YouDotComApi;

  beforeAll(() => {
    credentials = new YouDotComApi();
  });

  describe('Credential Configuration', () => {
    test('has correct name', () => {
      expect(credentials.name).toBe('youDotComApi');
    });

    test('has correct display name', () => {
      expect(credentials.displayName).toBe('You.com API');
    });

    test('has documentation URL', () => {
      expect(credentials.documentationUrl).toBe('https://docs.you.com/get-started/quickstart');
    });
  });

  describe('Properties', () => {
    test('has API key property', () => {
      const apiKeyProperty = credentials.properties.find((p) => p.name === 'apiKey');
      expect(apiKeyProperty).toBeDefined();
      expect(apiKeyProperty?.type).toBe('string');
      expect(apiKeyProperty?.required).toBe(true);
      expect(apiKeyProperty?.typeOptions?.password).toBe(true);
    });
  });

  describe('Authentication', () => {
    test('uses generic authentication with X-API-Key header', () => {
      expect(credentials.authenticate.type).toBe('generic');
      expect(credentials.authenticate.properties.headers?.['X-API-Key']).toBe('={{$credentials.apiKey}}');
    });
  });

  describe('Test Request', () => {
    test('has test request configured', () => {
      expect(credentials.test).toBeDefined();
      expect(credentials.test.request.baseURL).toBe('https://ydc-index.io');
      expect(credentials.test.request.url).toBe('/v1/search');
      expect(credentials.test.request.method).toBe('GET');
      expect(credentials.test.request.qs?.query).toBe('test');
    });
  });
});
