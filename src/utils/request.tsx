import { createAlova } from "alova";
import adapterFetch from "alova/fetch";

export const alovaInstance = createAlova({
  requestAdapter: adapterFetch(),
  responded: (response) => response.json(),
  beforeRequest: (method) => {
    method.config.headers["Authorization"] = localStorage.getItem('Authorization')
  }
});

// Define event data structure
export interface EventData<T> {
  type: string;
  data: T;
  id?: string;
}

// Define specific event listener types
type DataEventListener<T> = (data: EventData<T>) => void;
type ErrorEventListener = (error: Error) => void;
type SimpleEventListener = () => void;

// Generic event listener map type
type EventListenerMap<T> = {
  data: DataEventListener<T>[];
  error: ErrorEventListener[];
  open: SimpleEventListener[];
  close: SimpleEventListener[];
  end: SimpleEventListener[];
};

interface EventSourceStreamOptions<T> {
  headers?: Record<string, string>;
  body?: BodyInit | null | undefined;
  method?: "POST"| "GET";
  onOpen?: SimpleEventListener;
  onMessage?: DataEventListener<T>;
  onError?: ErrorEventListener;
  onClose?: SimpleEventListener;
}

/**
 * EventSourceStream - A Node.js-like stream implementation for SSE
 * 
 * This class provides a familiar event-based API for handling Server-Sent Events (SSE)
 * similar to Node.js streams. It allows subscribing to events like 'data', 'error', 'end',
 * and provides methods for pausing, resuming, and closing the connection.
 */
export class EventSourceStream<T> {
  private url: string;
  private options: EventSourceStreamOptions<T>;
  private controller: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private buffer: string = '';
  private isReading: boolean = false;
  private isClosed: boolean = false;
  private eventListeners: EventListenerMap<T> = {
    data: [],
    error: [],
    open: [],
    close: [],
    end: []
  };

  constructor(url: string, options: EventSourceStreamOptions<T> = {}) {
    this.url = url;
    this.options = options;
    
    // Add initial listeners if provided
    if (options.onOpen) this.on('open', options.onOpen);
    if (options.onMessage) this.on('data', options.onMessage);
    if (options.onError) this.on('error', options.onError);
    if (options.onClose) this.on('close', options.onClose);
  }

  /**
   * Start the SSE connection
   */
  public connect(): EventSourceStream<T> {
    if (this.isReading) return this;
    
    this.controller = new AbortController();
    this.isReading = true;
    this.isClosed = false;
    
    const headers = {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Authorization': localStorage.getItem('Authorization') || '',
      ...this.options.headers
    };

    fetch(this.url, {
      method: this.options?.method,
      body: this.options?.body,
      headers,
      signal: this.controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`SSE request failed with status ${response.status}`);
        }
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }
        
        this.emit('open');
        this.reader = response.body.getReader();
        this.readStream();
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          this.emit('error', error);
          this.close();
        }
      });

    return this;
  }

  /**
   * Read from the stream
   */
  private async readStream(): Promise<void> {
    if (!this.reader || !this.isReading) return;

    try {
      const { done, value } = await this.reader.read();
      
      if (done) {
        this.emit('end');
        this.close();
        return;
      }

      // Convert the Uint8Array to a string and add to buffer
      const chunk = new TextDecoder().decode(value);
      this.buffer += chunk;
      
      // Process any complete events in the buffer
      this.processBuffer();
      
      // Continue reading
      if (this.isReading) {
        this.readStream();
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.emit('error', error);
        this.close();
      }
    }
  }

  /**
   * Process the buffer for complete SSE events
   */
  private processBuffer(): void {
    // Split on double newlines which indicate end of an event
    const events = this.buffer.split(/\r\r|\n\n|\r\n\r\n/);
    
    // The last element might be incomplete, so keep it in the buffer
    this.buffer = events.pop() || '';
    
    for (const event of events) {
      if (!event.trim()) continue;
      
      let eventType = 'message';
      let data = '';
      let id = '';
      
      // Parse the event
      const lines = event.split(/\r|\n|\r\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Check for event field
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        }
        // Check for data field
        else if (line.startsWith('data:')) {
          data += line.slice(5).trim() + '\n';
        }
        // Check for id field
        else if (line.startsWith('id:')) {
          id = line.slice(3).trim();
        }
      }
      
      // Remove trailing newline from data
      if (data.endsWith('\n')) {
        data = data.slice(0, -1);
      }
      
      // Try to parse JSON data
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }
      
      // Emit the event
      this.emit('data', { type: eventType, data: parsedData as T, id });
    }
  }

  /**
   * Add an event listener
   */
  public on<K extends keyof EventListenerMap<T>>(
    event: K, 
    listener: EventListenerMap<T>[K][number]
  ): EventSourceStream<T> {
    // Type assertion needed here because TypeScript can't infer the exact array type
    // from the indexed access type EventListenerMap[K][number]
    (this.eventListeners[event] as Array<EventListenerMap<T>[K][number]>).push(listener);
    return this;
  }

  /**
   * Remove an event listener
   */
  public off<K extends keyof EventListenerMap<T>>(
    event: K, 
    listener: EventListenerMap<T>[K][number]
  ): EventSourceStream<T> {
    // Use type-specific handling based on the event type
    if (event === 'data') {
      const dataListeners = this.eventListeners.data;
      const index = dataListeners.indexOf(listener as DataEventListener<T>);
      if (index !== -1) {
        dataListeners.splice(index, 1);
      }
    } else if (event === 'error') {
      const errorListeners = this.eventListeners.error;
      const index = errorListeners.indexOf(listener as ErrorEventListener);
      if (index !== -1) {
        errorListeners.splice(index, 1);
      }
    } else if (['open', 'close', 'end'].includes(event as string)) {
      const simpleListeners = this.eventListeners[event] as SimpleEventListener[];
      const index = simpleListeners.indexOf(listener as SimpleEventListener);
      if (index !== -1) {
        simpleListeners.splice(index, 1);
      }
    }
    
    return this;
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: 'data', data: EventData<T>): void;
  private emit(event: 'error', error: Error): void;
  private emit(event: 'open' | 'close' | 'end'): void;
  private emit(event: keyof EventListenerMap<T>, data?: EventData<T> | Error): void {
    const listeners = this.eventListeners[event];
    
    if (event === 'data' && data) {
      for (const listener of listeners as DataEventListener<T>[]) {
        listener(data as EventData<T>);
      }
    } else if (event === 'error' && data) {
      for (const listener of listeners as ErrorEventListener[]) {
        listener(data as Error);
      }
    } else if (['open', 'close', 'end'].includes(event)) {
      for (const listener of listeners as SimpleEventListener[]) {
        listener();
      }
    }
  }

  /**
   * Pause the stream
   */
  public pause(): EventSourceStream<T> {
    this.isReading = false;
    return this;
  }

  /**
   * Resume the stream
   */
  public resume(): EventSourceStream<T> {
    if (!this.isReading && !this.isClosed) {
      this.isReading = true;
      this.readStream();
    }
    return this;
  }

  /**
   * Close the stream
   */
  public close(): EventSourceStream<T> {
    if (this.isClosed) return this;
    
    this.isReading = false;
    this.isClosed = true;
    
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    
    if (this.reader) {
      this.reader.cancel().catch(() => {});
      this.reader = null;
    }
    
    this.emit('close');
    return this;
  }

  /**
   * Check if the stream is closed
   */
  public get closed(): boolean {
    return this.isClosed;
  }
}

/**
 * Create an SSE stream with a Node.js-like API
 * 
 * @param url The URL to connect to
 * @param options Configuration options
 * @returns An EventSourceStream instance
 * 
 * @example
 * const stream = createSSEStream('/api/events')
 *   .on('data', (data) => console.log('Received:', data))
 *   .on('error', (err) => console.error('Error:', err))
 *   .on('end', () => console.log('Stream ended'))
 *   .connect();
 * 
 * // Later, to close the connection:
 * stream.close();
 */
export function createSSEStream<T>(url: string, options: EventSourceStreamOptions<T> = {}): EventSourceStream<T> {
  return new EventSourceStream(url, options);
}
