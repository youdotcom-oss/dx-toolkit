import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class YouDotComApi implements ICredentialType {
  name = 'youDotComApi';
  displayName = 'You.com API';
  documentationUrl = 'https://documentation.you.com/docs/quickstart';
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
      description: 'Your You.com API key. Get one at <a href="https://you.com/api" target="_blank">you.com/api</a>',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.ydc-index.io',
      url: '/v1/search',
      method: 'GET',
      qs: {
        query: 'test',
        count: 1,
      },
    },
  };
}
