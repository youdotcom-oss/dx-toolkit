import Anthropic from '@anthropic-ai/sdk';
import {
  type ChatSendOptions,
  type IChatModel,
  LocalMemory,
  type Message,
  type ModelMessage,
} from '@microsoft/teams.ai';
import { ConsoleLogger, type ILogger } from '@microsoft/teams.common';
import type { AnthropicChatModelOptions, AnthropicRequestOptions } from './teams-anthropic.types.ts';
import {
  extractSystemMessage,
  transformFromAnthropicMessage,
  transformToAnthropicMessages,
} from './teams-anthropic.utils.ts';

const isInputModelMessage = (input: Message): input is ModelMessage =>
  input.role === 'model' && Boolean(input?.function_calls);
const isHandler = (
  fn: unknown,
): fn is {
  (): unknown;
  handler: (args: unknown) => Promise<unknown>;
} => Boolean(fn && Object.hasOwn(fn, 'handler'));

/**
 * Type guard to check if a function definition has a description property
 */
const isFunctionWithDescription = (fn: unknown): fn is { description: string } =>
  typeof fn === 'object' &&
  fn !== null &&
  'description' in fn &&
  typeof (fn as { description: unknown }).description === 'string';

/**
 * Type guard to check if a function definition has a parameters property
 */
const isFunctionWithParameters = (fn: unknown): fn is { parameters: Record<string, unknown> } =>
  typeof fn === 'object' && fn !== null && 'parameters' in fn;

/**
 * Anthropic Claude chat model implementation for Microsoft Teams.ai
 *
 * @remarks
 * Implements the IChatModel interface to enable Claude models (Opus, Sonnet, Haiku)
 * in Microsoft Teams.ai applications.
 *
 * Features:
 * - Type-safe model selection via AnthropicModel enum
 * - Streaming support (via onChunk callback)
 * - Function/tool calling with auto-execution
 * - Multi-part content (text + images)
 * - Configurable request options (temperature, max_tokens, etc.)
 *
 * @example
 * ```typescript
 * const model = new AnthropicChatModel({
 *   model: AnthropicModel.CLAUDE_SONNET_4_5,
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   requestOptions: {
 *     max_tokens: 4096,
 *     temperature: 0.7,
 *   },
 * });
 *
 * const response = await model.send(
 *   { role: 'user', content: 'Hello!' },
 *   { system: { role: 'system', content: 'You are a helpful assistant.' } }
 * );
 * ```
 */
export class AnthropicChatModel implements IChatModel<AnthropicRequestOptions> {
  #anthropic: Anthropic;
  #model: string;
  #requestOptions?: AnthropicRequestOptions;
  #log: ILogger;

  /**
   * Create a new AnthropicChatModel instance
   *
   * @param options - Configuration options for the model
   * @throws Error if API key is not provided and ANTHROPIC_API_KEY env var is not set
   */
  constructor(options: AnthropicChatModelOptions) {
    this.#model = options.model;
    this.#requestOptions = options.requestOptions;
    this.#log = options.logger || new ConsoleLogger('AnthropicChatModel', { level: 'info' });

    // Initialize Anthropic SDK client
    this.#anthropic = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: options.baseUrl,
      defaultHeaders: options.headers,
      timeout: options.timeout || 60_000,
    });

    this.#log.log('info', `AnthropicChatModel initialized with model: ${this.#model}`);
  }

  /**
   * Send a message and get a response
   *
   * @param input - The message to send (user, model, function, or system message)
   * @param options - Optional chat send options
   * @returns Promise resolving to model response message
   *
   * @remarks
   * This method:
   * 1. Initializes conversation memory if not provided
   * 2. Adds input message to memory
   * 3. Extracts system message from conversation
   * 4. Transforms messages to Anthropic format
   * 5. Calls Anthropic API (streaming or non-streaming based on onChunk)
   * 6. Transforms response back to ModelMessage format
   * 7. Adds response to memory
   *
   * Function calling (if options.functions provided):
   * - Converts Teams.ai Function definitions to Anthropic Tool schema
   * - Auto-executes functions when autoFunctionCalling !== false
   * - Makes recursive send() call with function results
   *
   * Streaming (if options.onChunk provided):
   * - Calls onChunk for each text delta
   * - Accumulates full response
   * - Returns complete message when done
   */
  async send(input: Message, options?: ChatSendOptions<AnthropicRequestOptions>): Promise<ModelMessage> {
    try {
      // Initialize memory if not provided
      const memory = options?.messages || new LocalMemory();

      // Add input message to memory
      await memory.push(input);

      // Handle function execution if input is a model message with function calls
      if (isInputModelMessage(input)) {
        const shouldAutoExecute = options?.autoFunctionCalling !== false;

        if (shouldAutoExecute && input.function_calls && options?.functions) {
          this.#log.log('debug', `Auto-executing ${input.function_calls.length} function calls`);

          // Execute all function calls
          for (const call of input.function_calls) {
            const func = options.functions[call.name];

            if (isHandler(func)) {
              try {
                const handler = func.handler;
                const result = await handler(call.arguments);
                const message: Message = {
                  role: 'function',
                  function_id: call.id || call.name,
                  content: typeof result === 'string' ? result : JSON.stringify(result),
                };

                // Recursively call send() with function result
                return await this.send(message, options);
              } catch (error: unknown) {
                const fnErrorMsg = error instanceof Error ? error.message : String(error);
                this.#log.log('error', `Function execution failed: ${fnErrorMsg}`);

                // Return error as function result
                const message: Message = {
                  role: 'function',
                  function_id: call.id || call.name,
                  content: `Error: ${fnErrorMsg}`,
                };

                return await this.send(message, options);
              }
            }
          }
        }
      }

      // Get conversation messages
      const conversationMessages = await memory.values();

      // Extract system message (Anthropic requires separate system param)
      const systemMessage = extractSystemMessage(
        options?.system ? [options.system, ...conversationMessages] : conversationMessages,
      );

      // Transform messages to Anthropic format
      const anthropicMessages = transformToAnthropicMessages(conversationMessages);

      this.#log.log('debug', `Sending ${anthropicMessages.length} messages to Anthropic API`);

      // Build API request parameters
      const requestParams: Anthropic.MessageCreateParams = {
        model: this.#model,
        messages: anthropicMessages,
        max_tokens: options?.request?.max_tokens || this.#requestOptions?.max_tokens || 4096,
        ...this.#requestOptions,
        ...options?.request,
      };

      // Add system message if present
      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      // Add tools if functions provided
      if (options?.functions) {
        requestParams.tools = Object.entries(options.functions).map(([name, fn]) => ({
          name,
          description: isFunctionWithDescription(fn) ? fn.description : `Function: ${name}`,
          input_schema: {
            type: 'object' as const,
            properties: isFunctionWithParameters(fn) ? fn.parameters : {},
            required: [],
          },
        }));
      }

      // Check if streaming is enabled
      const isStreaming = !!options?.onChunk;

      if (isStreaming) {
        // Streaming mode
        const stream = this.#anthropic.messages.stream({
          ...requestParams,
          stream: true,
        });

        const textParts: string[] = [];
        const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const delta = event.delta.text;
              textParts.push(delta);

              // Call onChunk callback
              if (options.onChunk) {
                await options.onChunk(delta);
              }
            }
          } else if (event.type === 'content_block_start') {
            if (event.content_block.type === 'tool_use') {
              toolUses.push({
                id: event.content_block.id,
                name: event.content_block.name,
                input: event.content_block.input as Record<string, unknown>,
              });
            }
          }
        }

        // Build response message
        const modelMessage: ModelMessage = {
          role: 'model',
          content: textParts.join(''),
        };

        // Add function calls if tools were used
        if (toolUses.length > 0) {
          modelMessage.function_calls = toolUses.map((tool) => ({
            id: tool.id,
            name: tool.name,
            arguments: tool.input as { [key: string]: unknown },
          }));
        }

        // Add response to memory
        await memory.push(modelMessage);

        // If function calls present and auto-execution enabled, execute them
        if (modelMessage.function_calls && options.autoFunctionCalling !== false && options.functions) {
          return await this.send(modelMessage, options);
        }

        return modelMessage;
      }

      // Non-streaming mode
      const response = (await this.#anthropic.messages.create(requestParams)) as Anthropic.Message;

      this.#log.log('debug', `Received response from Anthropic API: ${response.id}`);

      // Transform response to ModelMessage
      const modelMessage = transformFromAnthropicMessage(response);

      // Add response to memory
      await memory.push(modelMessage);

      // If function calls present and auto-execution enabled, execute them
      if (modelMessage.function_calls && options?.autoFunctionCalling !== false && options?.functions) {
        return await this.send(modelMessage, options);
      }

      return modelMessage;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.#log.log('error', `AnthropicChatModel.send failed: ${errorMessage}`);

      // Return error as ModelMessage
      return {
        role: 'model',
        content: `Error: ${errorMessage}`,
      };
    }
  }
}
