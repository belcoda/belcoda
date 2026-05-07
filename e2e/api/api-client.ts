import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BASE_URL } from '../helpers/config';

export type ApiResponse<T = unknown> = {
	status: number;
	headers: Record<string, string>;
	body: T;
	raw: string;
};

export type ApiClient = {
	get<T = unknown>(path: string): Promise<ApiResponse<T>>;
	post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>>;
	put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>>;
	delete<T = unknown>(path: string): Promise<ApiResponse<T>>;
	/** Sends a raw string body (e.g. for testing invalid JSON parsing). */
	postRaw<T = unknown>(path: string, rawBody: string): Promise<ApiResponse<T>>;
	/** Sends a request with the given method, no auth header. */
	withApiKey(apiKey: string | null): ApiClient;
};

function url(path: string): string {
	return `${BASE_URL}${path}`;
}

async function parseResponse<T>(response: APIResponse): Promise<ApiResponse<T>> {
	const status = response.status();
	const headers = response.headers();
	const raw = await response.text();
	let body: T = undefined as unknown as T;
	if (raw.length > 0) {
		try {
			body = JSON.parse(raw) as T;
		} catch {
			body = raw as unknown as T;
		}
	}
	return { status, headers, raw, body };
}

function buildHeaders(apiKey: string | null): Record<string, string> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (apiKey) headers['x-api-key'] = apiKey;
	return headers;
}

/**
 * Wraps Playwright's `request` API context into a thin client that always
 * targets the local server's `/api/v1/*` routes with the supplied API key.
 *
 * Usage:
 *
 *   const api = createApiClient(request, apiKey);
 *   const res = await api.get<EventApi>(`/api/v1/events/${id}`);
 */
export function createApiClient(request: APIRequestContext, apiKey: string | null): ApiClient {
	const headers = buildHeaders(apiKey);

	const client: ApiClient = {
		async get<T>(path: string) {
			const response = await request.get(url(path), { headers });
			return parseResponse<T>(response);
		},
		async post<T>(path: string, body?: unknown) {
			const opts: Parameters<typeof request.post>[1] = { headers };
			if (body !== undefined) opts.data = body;
			const response = await request.post(url(path), opts);
			return parseResponse<T>(response);
		},
		async put<T>(path: string, body?: unknown) {
			const opts: Parameters<typeof request.put>[1] = { headers };
			if (body !== undefined) opts.data = body;
			const response = await request.put(url(path), opts);
			return parseResponse<T>(response);
		},
		async delete<T>(path: string) {
			const response = await request.delete(url(path), { headers });
			return parseResponse<T>(response);
		},
		async postRaw<T>(path: string, rawBody: string) {
			const response = await request.post(url(path), { headers, data: rawBody });
			return parseResponse<T>(response);
		},
		withApiKey(newKey: string | null) {
			return createApiClient(request, newKey);
		}
	};
	return client;
}
