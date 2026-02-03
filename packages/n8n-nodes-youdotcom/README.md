# n8n-nodes-youdotcom

An n8n community node for integrating [You.com APIs](https://you.com/api) into your n8n workflows. Search the web, extract content from URLs, or get AI-powered answers with citations.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```bash
npm install @youdotcom-oss/n8n-nodes-youdotcom
```

Or install via the n8n UI:

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `@youdotcom-oss/n8n-nodes-youdotcom`
4. Agree to the risks and select **Install**

## Operations

### Search

Search the web and news using You.com's search API.

| Parameter        | Required | Description                                             |
| ---------------- | -------- | ------------------------------------------------------- |
| Query            | Yes      | The search query (supports search operators, see below) |
| Count            | No       | Maximum number of results per section (1-100)           |
| Country          | No       | Country code for geographical focus (e.g., US, GB, DE)  |
| Freshness        | No       | Filter by recency: day, week, month, or year            |
| Language         | No       | Language of results (BCP 47 format)                     |
| Livecrawl        | No       | Fetch full page content for web, news, or all results   |
| Livecrawl Format | No       | Format for livecrawled content (HTML or Markdown)       |
| Offset           | No       | Pagination offset (0-9)                                 |
| Safe Search      | No       | Content moderation: off, moderate, or strict            |

**Search operators:**

Include these directly in your query to refine results. See [search operators documentation](https://docs.you.com/search/search-operators) for details.

| Operator   | Example                 | Description                                        |
| ---------- | ----------------------- | -------------------------------------------------- |
| `site:`    | `site:github.com`       | Restrict to a specific domain (including subdomains) |
| `filetype:`| `filetype:pdf`          | Filter by file type                                |
| `+`        | `+GAAP`                 | Require exact term in results                      |
| `-`        | `-marketing`            | Exclude exact term from results                    |
| `AND`      | `Python AND PyTorch`    | Logical AND to combine expressions                 |
| `OR`       | `Python OR PyTorch`     | Logical OR to combine expressions                  |
| `NOT`      | `NOT site:example.com`  | Negate an expression                               |

**Example:** `machine learning (Python OR PyTorch) -TensorFlow filetype:pdf` searches for ML content about Python or PyTorch, excluding TensorFlow, in PDF format.

### Get Contents

Extract content from one or more URLs. Returns clean text, HTML, or structured metadata.

| Parameter     | Required | Description                                              |
| ------------- | -------- | -------------------------------------------------------- |
| URLs          | Yes      | Comma-separated list of URLs to extract content from     |
| Formats       | No       | Output formats: Markdown, HTML, and/or Metadata          |
| Crawl Timeout | No       | Timeout in seconds for page crawling (1-60)              |

**Output formats:**

- **Markdown** - Clean text content, ideal for LLM processing
- **HTML** - Full HTML with layout preserved
- **Metadata** - Structured data (JSON-LD, OpenGraph, Twitter Cards)

### Express (AI Agent)

Get AI-generated answers with web search and citations. Perfect for RAG (Retrieval-Augmented Generation) workflows.

| Parameter         | Required | Description                                          |
| ----------------- | -------- | ---------------------------------------------------- |
| Input             | Yes      | Question or prompt for the AI agent                  |
| Enable Web Search | No       | Whether the AI should search the web (default: true) |

**Response includes:**

- `answer` - AI-generated response with citations
- `searchResults` - Web search results used for grounding (when web search is enabled)
- `agent` - Agent identifier

## Credentials

1. Visit [you.com/apis](https://you.com/apis) to get an API key
2. In n8n, go to **Credentials > New Credential**
3. Search for "You.com API"
4. Enter your API key and save

## Example Use Cases

- **Research workflows**: Search for information and extract full content from top results
- **Content aggregation**: Monitor news across topics with customizable filters
- **AI assistants**: Build chatbots with real-time web knowledge using Express
- **Data enrichment**: Extract metadata from URLs in your workflows
- **RAG pipelines**: Ground LLM responses with current web information

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Type checking
bun run check:types

# Linting and formatting
bun run check
```

## Resources

- [You.com API Documentation](https://docs.you.com/)
- [Search API Reference](https://docs.you.com/api-reference/search/v1-search)
- [Search Operators](https://docs.you.com/search/search-operators)
- [Contents API Reference](https://docs.you.com/api-reference/search/contents)
- [Express Agent Reference](https://docs.you.com/api-reference/agents/express-agent/express-agent-runs)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
