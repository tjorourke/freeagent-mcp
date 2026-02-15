import { FREEAGENT_API_BASE } from '../config.js';
import type { TokenManager } from '../auth/token-manager.js';
import { createRateLimiter, type RateLimiter } from './rate-limiter.js';
import { withRetry, type HttpError } from './retry-handler.js';

export interface FreeAgentClient {
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T>;
  post<T>(endpoint: string, body: unknown): Promise<T>;
  put<T>(endpoint: string, body: unknown): Promise<T>;
  delete(endpoint: string): Promise<void>;
  fetchAllPages<T>(
    endpoint: string,
    entityKey: string,
    params?: Record<string, string>
  ): Promise<T[]>;
  getRateLimitStatus(): ReturnType<RateLimiter['getStatus']>;
}

interface FreeAgentErrorResponse {
  errors?: Array<{ message: string }>;
  error?: string;
  error_description?: string;
}

export function createFreeAgentClient(tokenManager: TokenManager): FreeAgentClient {
  const rateLimiter = createRateLimiter();

  async function request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string>,
    _retried401 = false
  ): Promise<T> {
    return withRetry(async () => {
      await rateLimiter.checkLimits();

      const accessToken = await tokenManager.getAccessToken();

      let url = `${FREEAGENT_API_BASE}${endpoint}`;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'FreeAgent-MCP-Server/1.0.0',
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      rateLimiter.recordRequest();

      if (!response.ok) {
        // On 401, the stored access token may have been revoked externally.
        // Force a refresh and retry once before giving up.
        if (response.status === 401 && !_retried401) {
          tokenManager.invalidateAccessToken();
          return request<T>(method, endpoint, body, params, true);
        }
        const error = await parseErrorResponse(response);
        throw error;
      }

      if (method === 'DELETE' || response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    });
  }

  async function parseErrorResponse(response: Response): Promise<HttpError> {
    let message: string;
    let retryAfter: number | undefined;

    try {
      const data = (await response.json()) as FreeAgentErrorResponse;
      if (data.errors && data.errors.length > 0) {
        message = data.errors.map((e) => e.message).join('; ');
      } else if (data.error_description) {
        message = data.error_description;
      } else if (data.error) {
        message = data.error;
      } else {
        message = `HTTP ${response.status}`;
      }
    } catch {
      message = `HTTP ${response.status}: ${response.statusText}`;
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    if (retryAfterHeader) {
      retryAfter = parseInt(retryAfterHeader, 10);
    }

    const error = new Error(message) as HttpError;
    error.status = response.status;
    error.retryAfter = retryAfter;
    return error;
  }

  const client: FreeAgentClient = {
    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
      return request<T>('GET', endpoint, undefined, params);
    },

    async post<T>(endpoint: string, body: unknown): Promise<T> {
      return request<T>('POST', endpoint, body);
    },

    async put<T>(endpoint: string, body: unknown): Promise<T> {
      return request<T>('PUT', endpoint, body);
    },

    async delete(endpoint: string): Promise<void> {
      await request<void>('DELETE', endpoint);
    },

    async fetchAllPages<T>(
      endpoint: string,
      entityKey: string,
      params: Record<string, string> = {}
    ): Promise<T[]> {
      const results: T[] = [];
      let page = 1;
      const perPage = '100';
      const maxPages = 50; // Safety limit

      while (page <= maxPages) {
        const pageParams = {
          ...params,
          page: page.toString(),
          per_page: perPage,
        };

        const response = await request<Record<string, T[]>>(
          'GET',
          endpoint,
          undefined,
          pageParams
        );

        const items = response[entityKey];
        if (!items || items.length === 0) {
          break;
        }

        results.push(...items);

        // If we got fewer than requested, we're done
        if (items.length < parseInt(perPage, 10)) {
          break;
        }

        page++;
      }

      return results;
    },

    getRateLimitStatus() {
      return rateLimiter.getStatus();
    },
  };

  return client;
}
