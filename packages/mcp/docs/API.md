# You.com MCP Server API Reference

Complete technical documentation for all MCP tools provided by the You.com MCP Server.

For setup and usage guides, see [README.md](../README.md).
For development patterns and architecture, see [AGENTS.md](../AGENTS.md).

## Tools Overview

| Tool | Purpose | Authentication |
|------|---------|----------------|
| `you-search` | Web and news search with advanced filtering | X-API-Key |
| `you-express` | AI-powered answers with optional web search | Bearer token |
| `you-contents` | Content extraction from web pages | X-API-Key |

---

## `you-search`

Performs a comprehensive web and news search using the You.com Search API.

### Parameters

- `query` (string, required): The base search query to send to the You.com API. This will be combined with additional filters like site, fileType, and language to create the final search query. You can also use operators directly: + (exact term, e.g., "Enron +GAAP"), - (exclude term, e.g., "guitar -prs"), site: (domain, e.g., "site:uscourts.gov"), filetype: (e.g., "filetype:pdf"), lang: (e.g., "lang:es"). Use parentheses for multi-word phrases (e.g., "+(machine learning)", "-(social media)").
- `site` (string, optional): Search within a specific website domain (e.g., 'github.com')
- `fileType` (string, optional): Filter by a specific file type (e.g., 'pdf', 'doc', 'txt')
- `language` (string, optional): Filter by a specific language using ISO 639-1 code (e.g., 'en', 'es', 'fr')
- `exactTerms` (string, optional): Exact terms with logical operators: 'python AND|tutorial|NOT beginner' (pipe-separated, add AND/OR after terms, default OR). Use parentheses for multi-word phrases (e.g., '(machine learning)|typescript')
- `excludeTerms` (string, optional): Terms to exclude with logical operators: 'spam AND|ads|NOT relevant' (pipe-separated, add AND/OR after terms, default OR). Use parentheses for multi-word phrases (e.g., '(social media)|ads'). Cannot be used with exactTerms.
- `count` (integer, optional): Maximum number of results to return per section. Range: 1-20.
- `freshness` (string, optional): Freshness of results. Options: `day`, `week`, `month`, `year`.
- `offset` (integer, optional): Offset for pagination (calculated in multiples of count). Range: 0-9.
- `country` (string, optional): Country code for localized results. Examples: `US`, `GB`, `DE`, `FR`, `JP`, `CA`, `AU`, etc.
- `safesearch` (string, optional): Content filtering level. Options: `off`, `moderate` (default), `strict`.

### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "Search Results for \"machine learning\":\n\nWEB RESULTS:\n\nTitle: Introduction to Machine Learning\nURL: https://github.com/ml-tutorials/intro\nDescription: A comprehensive guide to machine learning fundamentals\nSnippets:\n- Learn the basics of supervised and unsupervised learning\n- Practical examples with Python and TensorFlow\n\n---\n\nTitle: Machine Learning Course\nURL: https://coursera.org/ml-course\nDescription: Stanford's machine learning course materials\nSnippets:\n- Mathematical foundations of ML algorithms\n- Hands-on programming assignments\n\n==================================================\n\nNEWS RESULTS:\n\nTitle: AI Breakthrough in Medical Diagnosis\nURL: https://techcrunch.com/ai-medical-breakthrough\nDescription: New machine learning model achieves 95% accuracy\nPublished: 2024-01-15T10:30:00"
    }
  ],
  "structuredContent": {
    "results": {
      "web": [
        {
          "url": "https://github.com/ml-tutorials/intro",
          "title": "Introduction to Machine Learning",
          "description": "A comprehensive guide to machine learning fundamentals",
          "snippets": [
            "Learn the basics of supervised and unsupervised learning",
            "Practical examples with Python and TensorFlow"
          ],
          "page_age": "2024-01-10T14:20:00",
          "authors": ["ML Tutorial Team"]
        }
      ],
      "news": [
        {
          "url": "https://techcrunch.com/ai-medical-breakthrough",
          "title": "AI Breakthrough in Medical Diagnosis",
          "description": "New machine learning model achieves 95% accuracy",
          "page_age": "2024-01-15T10:30:00"
        }
      ]
    },
    "metadata": {
      "query": "machine learning",
      "request_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "latency": 0.247
    }
  }
}
```

---

## `you-express`

Fast AI-powered agent for quick responses with optional real-time web search integration.

### Parameters

- `input` (string, required): The query or instruction to send to the Express agent. Example: "What is the capital of France?"
- `tools` (array, optional): Array of tool objects to expand the agent's capabilities. Currently supports:
  - `{ type: "web_search" }` - Enables real-time web search to provide more accurate and up-to-date information

### Features

- Fast response times optimized for straightforward queries
- Optional web search integration for real-time information
- AI-synthesized answers with source citations (when web_search is enabled)
- Non-streaming JSON responses (`stream: false`) for reliability

### Response Structure

The tool returns a token-efficient MCP response format:

- `answer` (string, required): AI-synthesized answer from the Express agent
- `results` (object, optional): Web search results included when `web_search` tool is used
  - `web` (array): Array of search result objects, each containing:
    - `url` (string): The URL of the search result
    - `title` (string): The title of the search result
    - `snippet` (string): A text snippet from the search result
- `agent` (string, optional): Agent identifier (e.g., "express")

### Example 1: Simple query without web_search

**Input:**

```json
{
  "input": "What is 2 + 2?"
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Express Agent Answer:\n\n2 + 2 equals 4."
    }
  ],
  "structuredContent": {
    "answer": "2 + 2 equals 4.",
    "agent": "express"
  }
}
```

### Example 2: Query with web_search enabled

**Input:**

```json
{
  "input": "What is the capital of France?",
  "tools": [{ "type": "web_search" }]
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Express Agent Answer:\n\nThe capital of France is Paris, the country's largest city and its political, economic, and cultural center..."
    },
    {
      "type": "text",
      "text": "\nSearch Results:\n\nTitle: Paris - Wikipedia\nURL: https://en.wikipedia.org/wiki/Paris\nSnippet: Paris is the capital and most populous city of France. With an official estimated population of 2,102,650 residents...\n\nTitle: Paris | History, Map, Population, & Facts | Britannica\nURL: https://www.britannica.com/place/Paris\nSnippet: Paris, city and capital of France, situated in the north-central part of the country..."
    }
  ],
  "structuredContent": {
    "answer": "The capital of France is Paris, the country's largest city and its political, economic, and cultural center...",
    "results": {
      "web": [
        {
          "url": "https://en.wikipedia.org/wiki/Paris",
          "title": "Paris - Wikipedia",
          "snippet": "Paris is the capital and most populous city of France. With an official estimated population of 2,102,650 residents..."
        },
        {
          "url": "https://www.britannica.com/place/Paris",
          "title": "Paris | History, Map, Population, & Facts | Britannica",
          "snippet": "Paris, city and capital of France, situated in the north-central part of the country..."
        }
      ]
    },
    "agent": "express"
  }
}
```

### Notes

- The `content` array always displays the answer first, followed by search results (if web_search was used)
- The response format is optimized for token efficiency, returning only essential fields
- Search results are formatted consistently with the `you-search` tool using shared formatting utilities

---

## `you-contents`

Extract and retrieve full content from web pages using the You.com Contents API. Returns content in markdown or HTML format for documentation, analysis, and content processing.

### Parameters

- `urls` (array of strings, required): Array of URLs to extract content from. The API processes all URLs in a single request. Example: `["https://example.com", "https://wikipedia.org/wiki/AI"]`
- `format` (string, optional): Output format for the extracted content. Default: `"markdown"`
  - `"markdown"` - Recommended for: text extraction, documentation, simpler consumption, and general content analysis
  - `"html"` - Recommended for: layout preservation, interactive content, visual fidelity, training data with structural details, and complex formatting

### Format Selection Guidance

**Use markdown when you need:**

- Clean, readable text without HTML tags
- Content for documentation or note-taking
- Simpler content parsing and processing
- Text-focused analysis

**Use HTML when you need:**

- Preserve original page layout and structure
- Interactive elements (forms, buttons, etc.)
- Visual fidelity and styling information
- Training data with semantic HTML structure
- Complex formatting like tables with styling

### Response Structure

The tool returns both text and structured content formats:

- `content` (array): Text representation with metadata and full extracted content
- `structuredContent` (object): Machine-readable format with metadata
  - `count` (number): Number of URLs processed
  - `format` (string): Format used for extraction ("markdown" or "html")
  - `items` (array): Array of extracted content objects, each containing:
    - `url` (string): URL of the extracted content
    - `title` (string): Page title
    - `content` (string): Full extracted content in the specified format
    - `contentLength` (number): Length of extracted content in characters

### Example 1: Single URL with markdown format (default)

**Input:**

```json
{
  "urls": ["https://example.com"]
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully extracted content from 1 URL(s):\n\n## Example Domain\nURL: https://example.com\nFormat: markdown\nContent Length: 156 characters\n\n---\n\n# Example Domain\n\nThis domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.\n\n[More information...](https://www.iana.org/domains/example)\n\n---\n"
    }
  ],
  "structuredContent": {
    "count": 1,
    "format": "markdown",
    "items": [
      {
        "url": "https://example.com",
        "title": "Example Domain",
        "content": "# Example Domain\n\nThis domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.\n\n[More information...](https://www.iana.org/domains/example)",
        "contentLength": 156
      }
    ]
  }
}
```

### Example 2: Multiple URLs with HTML format

**Input:**

```json
{
  "urls": [
    "https://example.com",
    "https://en.wikipedia.org/wiki/Artificial_intelligence"
  ],
  "format": "html"
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully extracted content from 2 URL(s):\n\n## Example Domain\nURL: https://example.com\nFormat: html\nContent Length: 1234 characters\n\n---\n\n<html><body><h1>Example Domain</h1><p>This domain is for use in illustrative examples...</p></body></html>\n\n---\n\n## Artificial intelligence - Wikipedia\nURL: https://en.wikipedia.org/wiki/Artificial_intelligence\nFormat: html\nContent Length: 45678 characters\n\n---\n\n<html><body><h1>Artificial intelligence</h1><p>Artificial intelligence (AI), in its broadest sense...</p></body></html>\n\n---\n"
    }
  ],
  "structuredContent": {
    "count": 2,
    "format": "html",
    "items": [
      {
        "url": "https://example.com",
        "title": "Example Domain",
        "content": "<html><body><h1>Example Domain</h1><p>This domain is for use in illustrative examples...</p></body></html>",
        "contentLength": 1234
      },
      {
        "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "title": "Artificial intelligence - Wikipedia",
        "content": "<html><body><h1>Artificial intelligence</h1><p>Artificial intelligence (AI), in its broadest sense...</p></body></html>",
        "contentLength": 45678
      }
    ]
  }
}
```

### Notes

- The API processes all URLs in a single request, making it efficient for batch extraction
- Full content is returned in both the text representation and structured format
- You.com URLs may return empty results due to self-scraping prevention
- For testing, use publicly accessible URLs like example.com, Wikipedia, or documentation sites
- The tool returns complete content without truncation, suitable for documentation and analysis workflows
