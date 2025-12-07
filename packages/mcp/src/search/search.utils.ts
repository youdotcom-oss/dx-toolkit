import { checkResponseForErrors } from '../shared/check-response-for-errors.ts';
import { formatSearchResultsText } from '../shared/format-search-results-text.ts';
import { type NewsResult, type SearchQuery, type SearchResponse, SearchResponseSchema } from './search.schemas.ts';

export const fetchSearchResults = async ({
  YDC_API_KEY = process.env.YDC_API_KEY,
  searchQuery: { query, site, fileType, language, exactTerms, excludeTerms, ...rest },
  getUserAgent,
}: {
  searchQuery: SearchQuery;
  YDC_API_KEY?: string;
  getUserAgent: () => string;
}) => {
  const url = new URL('https://ydc-index.io/v1/search');

  const searchParams = new URLSearchParams();

  // Build Query Param
  const searchQuery = [query];
  site && searchQuery.push(`site:${site}`);
  fileType && searchQuery.push(`fileType:${fileType}`);
  language && searchQuery.push(`lang:${language}`);
  if (exactTerms && excludeTerms) {
    throw new Error('Cannot specify both exactTerms and excludeTerms - please use only one');
  }
  exactTerms &&
    searchQuery.push(
      exactTerms
        .split('|')
        .map((term) => `+${term}`)
        .join(' AND '),
    );
  excludeTerms &&
    searchQuery.push(
      excludeTerms
        .split('|')
        .map((term) => `-${term}`)
        .join(' AND '),
    );
  searchParams.append('query', searchQuery.join(' '));

  // Append additional advanced Params
  for (const [name, value] of Object.entries(rest)) {
    if (value) searchParams.append(name, `${value}`);
  }

  url.search = searchParams.toString();

  const options = {
    method: 'GET',
    headers: new Headers({
      'X-API-Key': YDC_API_KEY || '',
      'User-Agent': getUserAgent(),
    }),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorCode = response.status;

    if (errorCode === 429) {
      throw new Error('Rate limited by You.com API. Please try again later.');
    } else if (errorCode === 403) {
      throw new Error('Forbidden. Please check your You.com API key.');
    }

    throw new Error(`Failed to perform search. Error code: ${errorCode}`);
  }

  const results = await response.json();

  // Check for error field in 200 responses (e.g., API limit errors)
  checkResponseForErrors(results);

  const parsedResults = SearchResponseSchema.parse(results);

  return parsedResults;
};

export const formatSearchResults = (response: SearchResponse) => {
  let formattedResults = '';

  // Format web results using shared utility (without URLs in text)
  if (response.results.web?.length) {
    const webResults = formatSearchResultsText(response.results.web);
    formattedResults += `WEB RESULTS:\n\n${webResults}`;
  }

  // Format news results (without URLs in text)
  if (response.results.news?.length) {
    const newsResults = response.results.news
      .map(
        (article: NewsResult) =>
          `Title: ${article.title}\nDescription: ${article.description}\nPublished: ${article.page_age}`,
      )
      .join('\n\n---\n\n');

    if (formattedResults) {
      formattedResults += `\n\n${'='.repeat(50)}\n\n`;
    }
    formattedResults += `NEWS RESULTS:\n\n${newsResults}`;
  }

  // Extract URLs and titles for structuredContent
  const structuredResults: {
    web?: Array<{ url: string; title: string }>;
    news?: Array<{ url: string; title: string }>;
  } = {};

  if (response.results.web?.length) {
    structuredResults.web = response.results.web.map((result) => ({
      url: result.url,
      title: result.title,
    }));
  }

  if (response.results.news?.length) {
    structuredResults.news = response.results.news.map((article) => ({
      url: article.url,
      title: article.title,
    }));
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: `Search Results for "${response.metadata.query}":\n\n${formattedResults}`,
      },
    ],
    structuredContent: {
      resultCounts: {
        web: response.results.web?.length || 0,
        news: response.results.news?.length || 0,
        total: (response.results.web?.length || 0) + (response.results.news?.length || 0),
      },
      results: Object.keys(structuredResults).length > 0 ? structuredResults : undefined,
    },
    fullResponse: response,
  };
};
