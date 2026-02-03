import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow'

/**
 * You.com API credentials for n8n.
 *
 * NOTE: n8n framework requires class-based credentials that implement ICredentialType.
 * This is an exception to the project's arrow function convention (see .plaited/rules/core.md).
 */
export class YouDotComApi implements ICredentialType {
  name = 'youDotComApi'
  displayName = 'You.com API'
  icon = { light: 'file:youdotcom.svg', dark: 'file:youdotcom.svg' } as const
  documentationUrl = 'https://docs.you.com/get-started/quickstart'
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your You.com API key. Get one at <a href="https://you.com/apis" target="_blank">you.com/apis</a>',
    },
  ]

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  }

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://ydc-index.io',
      url: '/v1/search',
      method: 'GET',
      qs: {
        query: 'test',
        count: 1,
      },
    },
  }
}
