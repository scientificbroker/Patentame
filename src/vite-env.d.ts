/// <reference types="vite/client" />

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '@vercel/node' {
  export interface VercelRequest {
    body: any;
    query: any;
    headers: any;
    method?: string;
    url?: string;
  }
  export interface VercelResponse {
    status(code: number): this;
    json(body: any): void;
    send(body: any): void;
    setHeader(name: string, value: string): this;
  }
}
