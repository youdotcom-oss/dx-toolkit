/**
 * TypeScript Language Server client using Bun.spawn
 *
 * @remarks
 * Spawns typescript-language-server as a subprocess and communicates via LSP JSON-RPC protocol.
 * Uses Bun's native spawn API for process management.
 *
 * @internal
 */

import type { Subprocess } from 'bun';

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

type JsonRpcNotification = {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

/**
 * LSP Client that manages a typescript-language-server subprocess
 */
export class LspClient {
  #process: Subprocess | null = null;
  #requestId = 0;
  #pendingRequests = new Map<number, PendingRequest>();
  #buffer = new Uint8Array(0);
  #contentLength = -1;
  #initialized = false;
  #rootUri: string;
  #serverCommand: string[];
  #requestTimeout: number;

  constructor({
    rootUri,
    command = ['bun', 'typescript-language-server', '--stdio'],
    requestTimeout = 30000,
  }: {
    rootUri: string;
    command?: string[];
    requestTimeout?: number;
  }) {
    this.#rootUri = rootUri;
    this.#serverCommand = command;
    this.#requestTimeout = requestTimeout;
  }

  /**
   * Start the LSP server subprocess
   */
  async start(): Promise<void> {
    if (this.#process) {
      throw new Error('LSP server already running');
    }

    this.#process = Bun.spawn(this.#serverCommand, {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Start reading stdout
    this.#readOutput();

    // Initialize the LSP connection
    await this.#initialize();
  }

  /**
   * Stop the LSP server subprocess
   */
  async stop(): Promise<void> {
    if (!this.#process) return;

    // Send shutdown request
    try {
      await this.request('shutdown', null);
      this.notify('exit');
    } catch {
      // Ignore errors during shutdown
    }

    this.#process.kill();
    this.#process = null;
    this.#initialized = false;
  }

  /**
   * Check if the LSP server is running
   */
  isRunning(): boolean {
    return this.#process !== null && this.#initialized;
  }

  /**
   * Send a request to the LSP server and wait for response
   */
  async request<T = unknown>(method: string, params: unknown): Promise<T> {
    if (!this.#process) {
      throw new Error('LSP server not running');
    }

    this.#requestId += 1;
    const id = this.#requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params: params ?? undefined,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pendingRequests.delete(id);
        reject(new Error(`LSP request timeout: ${method} (id=${id})`));
      }, this.#requestTimeout);

      this.#pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });
      this.#send(request);
    });
  }

  /**
   * Send a notification to the LSP server (no response expected)
   */
  notify(method: string, params?: unknown): void {
    if (!this.#process) {
      throw new Error('LSP server not running');
    }

    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.#send(notification);
  }

  // LSP Methods

  /**
   * textDocument/hover - Get hover information at a position
   */
  async hover(uri: string, line: number, character: number): Promise<unknown> {
    return this.request('textDocument/hover', {
      textDocument: { uri },
      position: { line, character },
    });
  }

  /**
   * textDocument/definition - Go to definition
   */
  async definition(uri: string, line: number, character: number): Promise<unknown> {
    return this.request('textDocument/definition', {
      textDocument: { uri },
      position: { line, character },
    });
  }

  /**
   * textDocument/references - Find all references
   */
  async references(uri: string, line: number, character: number, includeDeclaration = true): Promise<unknown> {
    return this.request('textDocument/references', {
      textDocument: { uri },
      position: { line, character },
      context: { includeDeclaration },
    });
  }

  /**
   * textDocument/completion - Get completions at a position
   */
  async completion(uri: string, line: number, character: number): Promise<unknown> {
    return this.request('textDocument/completion', {
      textDocument: { uri },
      position: { line, character },
    });
  }

  /**
   * textDocument/signatureHelp - Get signature help
   */
  async signatureHelp(uri: string, line: number, character: number): Promise<unknown> {
    return this.request('textDocument/signatureHelp', {
      textDocument: { uri },
      position: { line, character },
    });
  }

  /**
   * textDocument/documentSymbol - Get document symbols
   */
  async documentSymbols(uri: string): Promise<unknown> {
    return this.request('textDocument/documentSymbol', {
      textDocument: { uri },
    });
  }

  /**
   * workspace/symbol - Search for symbols across workspace
   */
  async workspaceSymbols(query: string): Promise<unknown> {
    return this.request('workspace/symbol', { query });
  }

  /**
   * Open a document in the LSP server
   */
  openDocument(uri: string, languageId: string, version: number, text: string): void {
    this.notify('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId,
        version,
        text,
      },
    });
  }

  /**
   * Close a document in the LSP server
   */
  closeDocument(uri: string): void {
    this.notify('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  async #initialize(): Promise<void> {
    const result = await this.request('initialize', {
      processId: process.pid,
      rootUri: this.#rootUri,
      capabilities: {
        textDocument: {
          hover: { contentFormat: ['markdown', 'plaintext'] },
          definition: { linkSupport: true },
          references: {},
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
            },
          },
          signatureHelp: {
            signatureInformation: {
              documentationFormat: ['markdown', 'plaintext'],
            },
          },
          documentSymbol: {
            hierarchicalDocumentSymbolSupport: true,
          },
        },
        workspace: {
          symbol: { symbolKind: {} },
        },
      },
    });

    this.notify('initialized', {});
    this.#initialized = true;

    return result as Promise<void>;
  }

  #send(message: JsonRpcRequest | JsonRpcNotification): void {
    const stdin = this.#process?.stdin;
    if (!stdin || typeof stdin === 'number') {
      throw new Error('LSP server stdin not available');
    }

    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;

    stdin.write(header + content);
  }

  async #readOutput(): Promise<void> {
    const stdout = this.#process?.stdout;
    if (!stdout || typeof stdout === 'number') return;

    const reader = stdout.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new bytes to buffer
        const newBuffer = new Uint8Array(this.#buffer.length + value.length);
        newBuffer.set(this.#buffer);
        newBuffer.set(value, this.#buffer.length);
        this.#buffer = newBuffer;

        this.#processBuffer();
      }
    } catch {
      // Stream closed
    }
  }

  #processBuffer(): void {
    const decoder = new TextDecoder();

    while (true) {
      // Parse header if we don't have content length yet
      if (this.#contentLength === -1) {
        // Look for header end sequence: \r\n\r\n
        const headerEndIndex = this.#findHeaderEnd();
        if (headerEndIndex === -1) break;

        const headerBytes = this.#buffer.slice(0, headerEndIndex);
        const header = decoder.decode(headerBytes);
        const match = header.match(/Content-Length: (\d+)/);
        if (!match?.[1]) {
          // Skip invalid header
          this.#buffer = this.#buffer.slice(headerEndIndex + 4);
          continue;
        }

        this.#contentLength = parseInt(match[1], 10);
        this.#buffer = this.#buffer.slice(headerEndIndex + 4);
      }

      // Check if we have enough content (now comparing bytes to bytes)
      if (this.#buffer.length < this.#contentLength) break;

      const contentBytes = this.#buffer.slice(0, this.#contentLength);
      const content = decoder.decode(contentBytes);
      this.#buffer = this.#buffer.slice(this.#contentLength);
      this.#contentLength = -1;

      try {
        const message = JSON.parse(content) as JsonRpcResponse;
        this.#handleMessage(message);
      } catch {
        // Skip invalid JSON
      }
    }
  }

  #findHeaderEnd(): number {
    // Look for \r\n\r\n sequence in buffer
    const CRLF = [13, 10, 13, 10]; // \r\n\r\n
    for (let i = 0; i <= this.#buffer.length - 4; i++) {
      if (
        this.#buffer[i] === CRLF[0] &&
        this.#buffer[i + 1] === CRLF[1] &&
        this.#buffer[i + 2] === CRLF[2] &&
        this.#buffer[i + 3] === CRLF[3]
      ) {
        return i;
      }
    }
    return -1;
  }

  #handleMessage(message: JsonRpcResponse): void {
    if ('id' in message && message.id !== undefined) {
      const pending = this.#pendingRequests.get(message.id);
      if (pending) {
        if (pending.timer) {
          clearTimeout(pending.timer);
        }
        this.#pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(`LSP Error: ${message.error.message}`));
        } else {
          pending.resolve(message.result);
        }
      }
    }
    // Notifications and server requests are ignored for now
  }
}
