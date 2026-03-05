declare module '@ai-sdk/svelte' {
  export interface ChatMessagePart {
    type: string;
    text?: string;
    state?: string;
  }

  export interface ChatMessage {
    id: string;
    role: 'system' | 'user' | 'assistant';
    parts: ChatMessagePart[];
    metadata?: unknown;
  }

  export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error' | string;

  export interface ChatRequestOptions {
    headers?: Record<string, string>;
    body?: object;
    metadata?: unknown;
  }

  export interface ChatOnFinishOptions {
    message: ChatMessage;
    messages: ChatMessage[];
    isAbort: boolean;
    isDisconnect: boolean;
    isError: boolean;
    finishReason?: string;
  }

  export interface ChatInit {
    id?: string;
    transport?: any;
    messages?: ChatMessage[];
    onError?: (error: Error) => void;
    onFinish?: (options: ChatOnFinishOptions) => void;
    onToolCall?: any;
    onData?: any;
  }

  export class Chat {
    messages: ChatMessage[];
    status: ChatStatus;
    error?: Error;
    lastMessage?: ChatMessage;
    constructor(init: ChatInit);
    sendMessage(
      message?:
        | { text: string; files?: any; messageId?: string; metadata?: unknown }
        | { files: any; messageId?: string; metadata?: unknown }
        | any,
      options?: ChatRequestOptions
    ): Promise<void>;
    regenerate(options?: { messageId?: string } & ChatRequestOptions): Promise<void>;
    stop(): Promise<void>;
    clearError(): void;
    resumeStream(options?: ChatRequestOptions): Promise<void>;
  }

  const _default: typeof Chat;
  export default _default;
}
