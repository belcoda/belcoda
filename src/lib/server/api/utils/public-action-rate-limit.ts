import { LRUCache } from 'lru-cache';

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 5;

type PublicActionRateLimitEntry = {
	count: number;
	resetAt: number;
};

export type PublicActionRateLimitAction = 'event_signup' | 'event_decline' | 'petition_sign';

export type PublicActionRateLimitResult =
	| {
			limited: false;
	  }
	| {
			limited: true;
			retryAfterSeconds: number;
	  };

const publicActionRateLimitCache = new LRUCache<string, PublicActionRateLimitEntry>({
	max: 50_000,
	ttl: DEFAULT_WINDOW_MS
});

export function checkPublicActionRateLimit({
	action,
	organizationId,
	resourceId,
	subject,
	maxRequests = DEFAULT_MAX_REQUESTS,
	windowMs = DEFAULT_WINDOW_MS
}: {
	action: PublicActionRateLimitAction;
	organizationId: string;
	resourceId: string;
	subject: string;
	maxRequests?: number;
	windowMs?: number;
}): PublicActionRateLimitResult {
	const key = `${action}:${organizationId}:${resourceId}:${subject}`;
	const now = Date.now();
	const existing = publicActionRateLimitCache.get(key);

	if (existing && existing.count >= maxRequests) {
		return {
			limited: true,
			retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
		};
	}

	publicActionRateLimitCache.set(
		key,
		{
			count: (existing?.count ?? 0) + 1,
			resetAt: existing?.resetAt ?? now + windowMs
		},
		{ ttl: existing ? Math.max(1, existing.resetAt - now) : windowMs }
	);

	return { limited: false };
}

export function clearPublicActionRateLimitForTest() {
	publicActionRateLimitCache.clear();
}
