# n8n-nodes-youdotcom

An n8n community node for integrating [You.com Search API](https://you.com/api) into your n8n workflows.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```bash
npm install n8n-nodes-youdotcom
```

Or install via the n8n UI:

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-youdotcom`
4. Agree to the risks and select **Install**

## Operations

### Search

Search the web and news using You.com's search API.

| Parameter        | Required | Description                                             |
| ---------------- | -------- | ------------------------------------------------------- |
| Query            | Yes      | The search query to retrieve relevant results           |
| Count            | No       | Maximum number of results per section (1-100)           |
| Country          | No       | Country code for geographical focus (e.g., US, GB, DE)  |
| Freshness        | No       | Filter by recency: day, week, month, or year            |
| Language         | No       | Language of results (BCP 47 format)                     |
| Livecrawl        | No       | Fetch full page content for web, news, or all results   |
| Livecrawl Format | No       | Format for livecrawled content (HTML or Markdown)       |
| Offset           | No       | Pagination offset (0-9)                                 |
| Safe Search      | No       | Content moderation: off, moderate, or strict            |

## Credentials

1. Visit [you.com/api](https://you.com/api) to get an API key
2. In n8n, go to **Credentials > New Credential**
3. Search for "You.com API"
4. Enter your API key and save

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Type checking
bun run check:types

# Linting
bun run lint
```

## Resources

- [You.com API Documentation](https://documentation.you.com/)
- [Search API Reference](https://documentation.you.com/api-reference/search/search)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
