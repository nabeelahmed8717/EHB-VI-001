/**
 * Minimal type stub for socket.io-client.
 * Run `npm install socket.io-client` in the frontend folder to get the real package.
 * This stub only silences the TypeScript compiler during development.
 */
declare module 'socket.io-client' {
  export interface Socket {
    on(event: string, listener: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): this;
    disconnect(): this;
  }
  export interface ManagerOptions {
    transports?: string[];
    auth?: Record<string, unknown>;
  }
  export function io(url: string, opts?: ManagerOptions): Socket;
}
