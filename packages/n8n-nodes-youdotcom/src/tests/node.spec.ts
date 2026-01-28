import { beforeAll, describe, expect, test } from 'bun:test';
import type { INodePropertyOptions } from 'n8n-workflow';
import { YouDotComApi } from '../credentials/YouDotComApi.credentials.ts';
import { YouDotCom } from '../nodes/YouDotCom/YouDotCom.node.ts';

/**
 * Unit tests for n8n YouDotCom node
 *
 * Test Strategy:
 * - Node description validation: Verify node metadata and configuration
 * - Credentials validation: Verify credential configuration
 * - Parameter validation: Verify all search parameters are properly defined
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
      expect(node.description.requestDefaults?.baseURL).toBe('https://api.ydc-index.io');
    });
  });

  describe('Operations', () => {
    test('has search operation', () => {
      const operationProperty = node.description.properties.find((p) => p.name === 'operation') as
        | PropertyWithOptions
        | undefined;
      expect(operationProperty).toBeDefined();
      expect(operationProperty?.type).toBe('options');

      const searchOption = operationProperty?.options?.find((o) => o.value === 'search');
      expect(searchOption).toBeDefined();
      expect(searchOption?.name).toBe('Search');
      expect((searchOption as INodePropertyOptions & { action?: string })?.action).toBe('Search the web and news');
    });
  });

  describe('Search Parameters', () => {
    const getOptionsProperty = (): PropertyWithOptions | undefined => {
      return node.description.properties.find((p) => p.name === 'options') as PropertyWithOptions | undefined;
    };

    const getOption = (displayName: string): PropertyWithOptions | undefined => {
      const optionsProperty = getOptionsProperty();
      // Options in a collection are INodeProperties, which have both 'displayName' and 'name' fields
      const options = optionsProperty?.options as unknown as PropertyWithOptions[] | undefined;
      return options?.find((o) => o.displayName === displayName);
    };

    test('has query parameter as required', () => {
      const queryProperty = node.description.properties.find((p) => p.name === 'query');
      expect(queryProperty).toBeDefined();
      expect(queryProperty?.required).toBe(true);
      expect(queryProperty?.type).toBe('string');
    });

    test('has options collection', () => {
      const optionsProperty = getOptionsProperty();
      expect(optionsProperty).toBeDefined();
      expect(optionsProperty?.type).toBe('collection');
    });

    test('has count option with correct constraints', () => {
      const countOption = getOption('Count');
      expect(countOption).toBeDefined();
      expect(countOption?.type).toBe('number');
      expect(countOption?.typeOptions?.minValue).toBe(1);
      expect(countOption?.typeOptions?.maxValue).toBe(100);
    });

    test('has country option with supported countries', () => {
      const countryOption = getOption('Country');
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
      const freshnessOption = getOption('Freshness');
      expect(freshnessOption).toBeDefined();
      expect(freshnessOption?.type).toBe('options');

      const freshnessValues = freshnessOption?.options?.map((o) => o.value);
      expect(freshnessValues).toContain('day');
      expect(freshnessValues).toContain('week');
      expect(freshnessValues).toContain('month');
      expect(freshnessValues).toContain('year');
    });

    test('has language option with BCP 47 codes', () => {
      const languageOption = getOption('Language');
      expect(languageOption).toBeDefined();
      expect(languageOption?.type).toBe('options');

      const languageValues = languageOption?.options?.map((o) => o.value);
      expect(languageValues).toContain('EN');
      expect(languageValues).toContain('DE');
      expect(languageValues).toContain('FR');
      expect(languageValues).toContain('JP');
    });

    test('has livecrawl option', () => {
      const livecrawlOption = getOption('Livecrawl');
      expect(livecrawlOption).toBeDefined();
      expect(livecrawlOption?.type).toBe('options');

      const livecrawlValues = livecrawlOption?.options?.map((o) => o.value);
      expect(livecrawlValues).toContain('web');
      expect(livecrawlValues).toContain('news');
      expect(livecrawlValues).toContain('all');
    });

    test('has livecrawl format option with conditional display', () => {
      const formatOption = getOption('Livecrawl Format');
      expect(formatOption).toBeDefined();
      expect(formatOption?.type).toBe('options');
      expect(formatOption?.displayOptions?.show?.livecrawl).toEqual(['web', 'news', 'all']);

      const formatValues = formatOption?.options?.map((o) => o.value);
      expect(formatValues).toContain('html');
      expect(formatValues).toContain('markdown');
    });

    test('has offset option with correct constraints', () => {
      const offsetOption = getOption('Offset');
      expect(offsetOption).toBeDefined();
      expect(offsetOption?.type).toBe('number');
      expect(offsetOption?.typeOptions?.minValue).toBe(0);
      expect(offsetOption?.typeOptions?.maxValue).toBe(9);
    });

    test('has safesearch option', () => {
      const safesearchOption = getOption('Safe Search');
      expect(safesearchOption).toBeDefined();
      expect(safesearchOption?.type).toBe('options');

      const safesearchValues = safesearchOption?.options?.map((o) => o.value);
      expect(safesearchValues).toContain('off');
      expect(safesearchValues).toContain('moderate');
      expect(safesearchValues).toContain('strict');
    });

    test('has site option', () => {
      const siteOption = getOption('Site');
      expect(siteOption).toBeDefined();
      expect(siteOption?.type).toBe('string');
    });

    test('has fileType option', () => {
      const fileTypeOption = getOption('File Type');
      expect(fileTypeOption).toBeDefined();
      expect(fileTypeOption?.type).toBe('string');
    });

    test('has excludeTerms option', () => {
      const excludeTermsOption = getOption('Exclude Terms');
      expect(excludeTermsOption).toBeDefined();
      expect(excludeTermsOption?.type).toBe('string');
    });

    test('has exactTerms option', () => {
      const exactTermsOption = getOption('Exact Terms');
      expect(exactTermsOption).toBeDefined();
      expect(exactTermsOption?.type).toBe('string');
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
      expect(credentials.documentationUrl).toBe('https://documentation.you.com/docs/quickstart');
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
      expect(credentials.test.request.baseURL).toBe('https://api.ydc-index.io');
      expect(credentials.test.request.url).toBe('/v1/search');
      expect(credentials.test.request.method).toBe('GET');
      expect(credentials.test.request.qs?.query).toBe('test');
    });
  });
});
