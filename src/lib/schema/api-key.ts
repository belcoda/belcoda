import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const apiKeySchema = v.object({
	id: helpers.uuid,
	name: v.nullable(helpers.mediumStringEmpty),
	start: v.nullable(helpers.mediumStringEmpty),
	prefix: v.nullable(helpers.mediumStringEmpty),
	key: helpers.mediumStringEmpty,
	userId: v.nullable(helpers.uuid),
	referenceId: helpers.uuid,
	refillInterval: v.nullable(helpers.count),
	refillAmount: v.nullable(helpers.count),
	lastRefillAt: v.nullable(helpers.date),
	enabled: v.boolean(),
	rateLimitEnabled: v.boolean(),
	rateLimitTimeWindow: v.nullable(helpers.count),
	rateLimitMax: v.nullable(helpers.count),
	requestCount: helpers.count,
	remaining: v.nullable(helpers.count),
	lastRequest: v.nullable(helpers.date),
	expiresAt: v.nullable(helpers.date),
	createdAt: helpers.date,
	updatedAt: helpers.date,
	permissions: v.nullable(helpers.longStringEmpty),
	metadata: v.nullable(v.unknown())
});
export type ApiKeySchema = v.InferOutput<typeof apiKeySchema>;

export const readApiKeyRest = v.object({
	id: apiKeySchema.entries.id,
	name: apiKeySchema.entries.name,
	start: apiKeySchema.entries.start,
	prefix: apiKeySchema.entries.prefix,
	userId: apiKeySchema.entries.userId,
	refillInterval: apiKeySchema.entries.refillInterval,
	refillAmount: apiKeySchema.entries.refillAmount,
	lastRefillAt: apiKeySchema.entries.lastRefillAt,
	enabled: apiKeySchema.entries.enabled,
	rateLimitEnabled: apiKeySchema.entries.rateLimitEnabled,
	rateLimitTimeWindow: apiKeySchema.entries.rateLimitTimeWindow,
	rateLimitMax: apiKeySchema.entries.rateLimitMax,
	requestCount: apiKeySchema.entries.requestCount,
	remaining: apiKeySchema.entries.remaining,
	lastRequest: apiKeySchema.entries.lastRequest,
	expiresAt: apiKeySchema.entries.expiresAt,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	permissions: apiKeySchema.entries.permissions,
	metadata: apiKeySchema.entries.metadata
});
export type ReadApiKeyRest = v.InferOutput<typeof readApiKeyRest>;

export const readApiKeyZero = v.object({
	...readApiKeyRest.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadApiKeyZero = v.InferOutput<typeof readApiKeyZero>;

//doesn't need a mutator schema, because it is handled through the better-aut library's own API
