# Advanced Patterns

This guide covers advanced usage patterns for the `@youdotcom-oss/teams-mcp-client` library, including error handling, retry logic, timeout management, and performance optimization.

## Error Handling

### Basic Error Handling

```typescript
import { createMcpPlugin, McpPluginError } from '@youdotcom-oss/teams-mcp-client';

try {
  const { plugin, config } = createMcpPlugin({
    apiKey: process.env.YDC_API_KEY,
  });
} catch (err) {
  if (err instanceof McpPluginError) {
    console.error(`MCP Error [${err.code}]:`, err.message);

    // Log to monitoring service
    logger.error({
      error: err.message,
      code: err.code,
      stack: err.stack,
    });
  } else {
    console.error('Unexpected error:', err);
  }
}
```

### Error Code Handling

```typescript
import { createMcpPlugin, McpPluginError, ErrorCodes } from '@youdotcom-oss/teams-mcp-client';

function handleMcpError(error: McpPluginError): string {
  switch (error.code) {
    case ErrorCodes.MISSING_API_KEY:
      return 'Configuration error: API key is missing. Please check your environment variables.';

    case ErrorCodes.INVALID_CONFIG:
      return 'Configuration error: Invalid settings detected. Please review your configuration.';

    case ErrorCodes.CONNECTION_FAILED:
      return 'Connection error: Unable to reach MCP server. Please check your network.';

    case ErrorCodes.TIMEOUT:
      return 'Timeout error: Request took too long. Please try again or increase timeout.';

    case ErrorCodes.PLUGIN_CREATION_FAILED:
      return 'Initialization error: Failed to create plugin. Please contact support.';

    default:
      return `Unknown error: ${error.message}`;
  }
}

// Usage in bot
try {
  const { plugin, config } = createMcpPlugin();
} catch (err) {
  if (err instanceof McpPluginError) {
    const userMessage = handleMcpError(err);
    await context.sendActivity(userMessage);
  }
}
```

### Graceful Degradation

```typescript
import { createMcpPlugin, McpPluginError } from '@youdotcom-oss/teams-mcp-client';

class BotWithFallback {
  private mcpEnabled = false;
  private plugin: any;
  private config: any;

  async initialize() {
    try {
      const result = createMcpPlugin({
        apiKey: process.env.YDC_API_KEY,
        timeout: 30000,
      });

      this.plugin = result.plugin;
      this.config = result.config;
      this.mcpEnabled = true;

      console.log('MCP plugin enabled');
    } catch (err) {
      console.warn('MCP plugin disabled, using fallback mode:', err);
      this.mcpEnabled = false;
    }
  }

  async handleMessage(context: any, message: string) {
    if (this.mcpEnabled) {
      try {
        // Use MCP tools
        return await this.processWithMcp(context, message);
      } catch (err) {
        console.error('MCP processing failed, falling back:', err);
        return await this.processFallback(context, message);
      }
    } else {
      return await this.processFallback(context, message);
    }
  }

  private async processWithMcp(context: any, message: string) {
    // Process with MCP tools
    const response = await context.ai.completePrompt();
    return response.text;
  }

  private async processFallback(context: any, message: string) {
    // Process without MCP (limited capabilities)
    return "I'm currently in limited mode. Some features may be unavailable.";
  }
}
```

## Retry Logic

### Exponential Backoff

```typescript
import { createMcpPlugin, McpPluginError, ErrorCodes } from '@youdotcom-oss/teams-mcp-client';

async function createPluginWithRetry(
  maxRetries = 3,
  baseDelay = 1000
): Promise<ReturnType<typeof createMcpPlugin>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return createMcpPlugin({
        apiKey: process.env.YDC_API_KEY,
        timeout: 30000 * attempt, // Increase timeout with each retry
      });
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;

      if (err instanceof McpPluginError) {
        // Only retry on transient errors
        const shouldRetry =
          err.code === ErrorCodes.TIMEOUT ||
          err.code === ErrorCodes.CONNECTION_FAILED;

        if (!shouldRetry || isLastAttempt) {
          throw err;
        }

        // Exponential backoff: 1s, 2s, 4s...
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
try {
  const { plugin, config } = await createPluginWithRetry(3, 1000);
  console.log('Plugin created successfully after retries');
} catch (err) {
  console.error('Failed to create plugin after all retries:', err);
}
```

### Circuit Breaker Pattern

```typescript
import { createMcpPlugin, McpPluginError, ErrorCodes } from '@youdotcom-oss/teams-mcp-client';

class McpCircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly timeout = 60000; // 1 minute
  private plugin: any = null;
  private config: any = null;

  async getPlugin() {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.timeout) {
        console.log('Circuit breaker entering half-open state');
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    if (!this.plugin) {
      await this.createPlugin();
    }

    return { plugin: this.plugin, config: this.config };
  }

  private async createPlugin() {
    try {
      const result = createMcpPlugin({
        apiKey: process.env.YDC_API_KEY,
      });

      this.plugin = result.plugin;
      this.config = result.config;

      // Success - reset failure count
      if (this.state === 'half-open') {
        console.log('Circuit breaker closing - service recovered');
      }
      this.state = 'closed';
      this.failureCount = 0;
    } catch (err) {
      this.handleFailure();
      throw err;
    }
  }

  private handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      console.error(`Circuit breaker opening after ${this.failureCount} failures`);
      this.state = 'open';
    }
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// Usage
const circuitBreaker = new McpCircuitBreaker();

async function handleBotMessage(context: any) {
  try {
    const { plugin, config } = await circuitBreaker.getPlugin();
    // Use plugin...
  } catch (err) {
    if (err.message.includes('Circuit breaker is open')) {
      await context.sendActivity('Service temporarily unavailable. Please try again later.');
    } else {
      throw err;
    }
  }
}
```

## Timeout Management

### Dynamic Timeout Based on Request Type

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

class AdaptiveTimeoutMcp {
  private plugins = new Map<string, any>();

  async getPlugin(requestType: 'fast' | 'normal' | 'slow') {
    const timeouts = {
      fast: 10000,    // 10 seconds for simple queries
      normal: 30000,  // 30 seconds for typical queries
      slow: 60000,    // 60 seconds for complex queries
    };

    const timeout = timeouts[requestType];
    const cacheKey = `plugin_${timeout}`;

    if (!this.plugins.has(cacheKey)) {
      const result = createMcpPlugin({
        apiKey: process.env.YDC_API_KEY,
        timeout,
        debug: true,
      });
      this.plugins.set(cacheKey, result);
    }

    return this.plugins.get(cacheKey);
  }
}

// Usage
const adaptiveMcp = new AdaptiveTimeoutMcp();

async function handleQuery(query: string) {
  // Determine request type based on query complexity
  const requestType = query.length > 200 ? 'slow' :
                     query.length > 50 ? 'normal' : 'fast';

  const { plugin, config } = await adaptiveMcp.getPlugin(requestType);

  console.log(`Using ${requestType} timeout (${config.timeout}ms) for query`);
  // Process query...
}
```

### Timeout with Progress Updates

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

async function processWithProgress(context: any, query: string) {
  const { plugin, config } = createMcpPlugin({
    apiKey: process.env.YDC_API_KEY,
    timeout: 60000, // 60 seconds
  });

  // Send initial "thinking" message
  const thinkingMessage = await context.sendActivity('Processing your request...');

  // Update message every 10 seconds
  const progressInterval = setInterval(async () => {
    await context.updateActivity({
      ...thinkingMessage,
      text: 'Still working on it...',
    });
  }, 10000);

  try {
    // Process with MCP
    const response = await context.ai.completePrompt(query);

    clearInterval(progressInterval);

    // Send final response
    await context.updateActivity({
      ...thinkingMessage,
      text: response.text,
    });
  } catch (err) {
    clearInterval(progressInterval);

    if (err.code === 'TIMEOUT') {
      await context.sendActivity('Request timed out. Please try a simpler query or try again later.');
    } else {
      throw err;
    }
  }
}
```

## Performance Optimization

### Plugin Caching

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

class McpPluginCache {
  private static instance: McpPluginCache;
  private plugin: any = null;
  private config: any = null;
  private createdAt = 0;
  private readonly ttl = 3600000; // 1 hour

  static getInstance(): McpPluginCache {
    if (!McpPluginCache.instance) {
      McpPluginCache.instance = new McpPluginCache();
    }
    return McpPluginCache.instance;
  }

  async getPlugin() {
    const now = Date.now();

    // Check if cache is valid
    if (this.plugin && (now - this.createdAt) < this.ttl) {
      return { plugin: this.plugin, config: this.config };
    }

    // Create new plugin
    console.log('Creating new MCP plugin (cache expired or empty)');
    const result = createMcpPlugin({
      apiKey: process.env.YDC_API_KEY,
    });

    this.plugin = result.plugin;
    this.config = result.config;
    this.createdAt = now;

    return result;
  }

  invalidate() {
    this.plugin = null;
    this.config = null;
    this.createdAt = 0;
  }
}

// Usage
const cache = McpPluginCache.getInstance();

async function handleMessage(context: any) {
  const { plugin, config } = await cache.getPlugin();
  // Use plugin...
}
```

### Rate Limiting

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

class RateLimitedMcp {
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly maxConcurrent = 5;
  private readonly delayBetweenRequests = 200; // ms
  private activeRequests = 0;

  async enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.requestQueue.length > 0) {
      // Wait if too many concurrent requests
      while (this.activeRequests >= this.maxConcurrent) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;

        request()
          .finally(() => {
            this.activeRequests--;
          });

        // Delay between requests
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
        }
      }
    }

    this.processing = false;
  }
}

// Usage
const rateLimiter = new RateLimitedMcp();
const { plugin, config } = createMcpPlugin({ apiKey: process.env.YDC_API_KEY });

async function handleConcurrentQueries(queries: string[]) {
  const results = await Promise.all(
    queries.map(query =>
      rateLimiter.enqueueRequest(async () => {
        // Process query with MCP
        return await processQuery(query);
      })
    )
  );

  return results;
}
```

### Response Caching

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly ttl = 300000; // 5 minutes

  async getCached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.ttl) {
      console.log(`Cache hit for key: ${key}`);
      return cached.data;
    }

    console.log(`Cache miss for key: ${key}`);
    const data = await fn();
    this.cache.set(key, { data, timestamp: now });

    // Clean up old entries
    this.cleanup();

    return data;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const responseCache = new ResponseCache();
const { plugin, config } = createMcpPlugin({ apiKey: process.env.YDC_API_KEY });

async function handleQuery(query: string) {
  // Create cache key from query
  const cacheKey = `query:${query.toLowerCase().trim()}`;

  return await responseCache.getCached(cacheKey, async () => {
    // Process query with MCP (expensive operation)
    return await processQuery(query);
  });
}
```

## Configuration Management

### Multi-Environment Configuration

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

interface EnvironmentConfig {
  apiKey: string;
  mcpUrl?: string;
  timeout: number;
  debug: boolean;
}

class ConfigManager {
  private configs: Record<string, EnvironmentConfig> = {
    development: {
      apiKey: process.env.YDC_API_KEY_DEV || '',
      timeout: 60000,
      debug: true,
    },
    staging: {
      apiKey: process.env.YDC_API_KEY_STAGING || '',
      timeout: 45000,
      debug: true,
    },
    production: {
      apiKey: process.env.YDC_API_KEY || '',
      timeout: 30000,
      debug: false,
    },
  };

  getConfig(env: string = process.env.NODE_ENV || 'development') {
    const config = this.configs[env];
    if (!config) {
      throw new Error(`Unknown environment: ${env}`);
    }
    return config;
  }

  createPlugin(env?: string) {
    const config = this.getConfig(env);
    return createMcpPlugin(config);
  }
}

// Usage
const configManager = new ConfigManager();
const { plugin, config } = configManager.createPlugin();
```

## Monitoring and Logging

### Custom Logger Integration

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';
import { logger } from './logger.js'; // Your logging service

class MonitoredMcp {
  private plugin: any;
  private config: any;

  async initialize() {
    const startTime = Date.now();

    try {
      const result = createMcpPlugin({
        apiKey: process.env.YDC_API_KEY,
        debug: false, // Use custom logger instead
      });

      this.plugin = result.plugin;
      this.config = result.config;

      const duration = Date.now() - startTime;

      logger.info('MCP plugin initialized', {
        duration,
        mcpUrl: this.config.mcpUrl,
        timeout: this.config.timeout,
      });

      // Track metric
      metrics.recordInitialization(duration);
    } catch (err) {
      logger.error('MCP plugin initialization failed', {
        error: err.message,
        code: err.code,
        stack: err.stack,
      });

      // Track error
      metrics.recordError('initialization', err.code);

      throw err;
    }
  }

  async processRequest(query: string) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    logger.info('Processing MCP request', { requestId, query });

    try {
      const result = await this.doProcess(query);
      const duration = Date.now() - startTime;

      logger.info('MCP request completed', {
        requestId,
        duration,
        resultLength: result.length,
      });

      metrics.recordRequest(duration, 'success');

      return result;
    } catch (err) {
      const duration = Date.now() - startTime;

      logger.error('MCP request failed', {
        requestId,
        duration,
        error: err.message,
        code: err.code,
      });

      metrics.recordRequest(duration, 'error', err.code);

      throw err;
    }
  }

  private async doProcess(query: string): Promise<string> {
    // Implementation
    return '';
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

## Testing

### Mock MCP Plugin for Tests

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

export function createMockMcpPlugin() {
  return {
    plugin: {
      // Mock plugin methods
      execute: jest.fn().mockResolvedValue({ success: true }),
    },
    config: {
      apiKey: 'mock-api-key',
      mcpUrl: 'https://mock.api.com/mcp',
      timeout: 30000,
      debug: false,
      url: 'https://mock.api.com/mcp',
      params: {
        headers: {
          Authorization: 'Bearer mock-api-key',
        },
        timeout: 30000,
      },
    },
  };
}

// Usage in tests
describe('Bot with MCP', () => {
  it('should handle queries with MCP plugin', async () => {
    const mockMcp = createMockMcpPlugin();

    // Test your bot with mock plugin
    const response = await processQuery('test query', mockMcp.plugin);

    expect(response).toBeDefined();
    expect(mockMcp.plugin.execute).toHaveBeenCalled();
  });
});
```

## Additional Resources

- [Basic Bot Example](./basic-bot.md)
- [Deployment Guide](./deployment.md)
- [API Documentation](../API.md)
- [You.com MCP Server](https://github.com/youdotcom-oss/dx-toolkit/tree/main/packages/mcp)
