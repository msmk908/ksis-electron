declare module 'event-source-polyfill' {
  export class EventSourcePolyfill {
    constructor(url: string, eventSourceInitDict?: EventSourceInit);
    close(): void;
    addEventListener(type: string, listener: (event: MessageEvent) => void): void;
    removeEventListener(type: string, listener?: (event: MessageEvent) => void): void;
    onopen?: (event: Event) => void;
    onmessage?: (event: MessageEvent) => void;
    onerror?: (event: Event) => void;
  }

  export interface EventSourceInit {
    withCredentials?: boolean;
    headers?: Record<string, string>;
    proxy?: string;
    https?: any;
  }
}
