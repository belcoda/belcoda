import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

import { openAPI, apiKey, organization } from 'better-auth/plugins';
import { oneTimeToken } from 'better-auth/plugins/one-time-token';

import { dev } from '$app/environment';

import { stripe } from '@better-auth/stripe';

import Stripe from 'stripe';
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2025-11-17.clover' // Latest API version as of Stripe SDK v20.0.0
});

import { LRUCache } from 'lru-cache';
const cache = new LRUCache<string, string>({
	max: 1000, // Max 100 sessions
	ttl: 1000 * 60 * 10, // 10 minutes TTL
	allowStale: false, // Don't return expired objects
	updateAgeOnGet: true, // Extend TTL when accessed (keeps active sessions alive)
	updateAgeOnHas: false, // Don't extend TTL on existence check
	ttlAutopurge: false // Don't automatically remove expired items, only remove on LRU eviction or when fetched and tested for expiry
});

import { type LanguageCode, clampLocale } from '$lib/utils/language';

import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { emailVerification } from '$lib/server/utils/email/context/transactional/auth/verify_email';
import { passwordReset } from '$lib/server/utils/email/context/transactional/auth/password_reset';

export function buildBetterAuth(localeInput: string) {
	const locale = clampLocale(localeInput as LanguageCode);
	return betterAuth({
		appName: 'Belcoda',
		emailAndPassword: {
			enabled: true,
			autoSignIn: false, // Disable auto sign-in when email verification is required
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url, token }, request) => {
				const email = passwordReset({ url, locale });
				await sendTemplateEmail({
					to: user.email,
					from: 'Belcoda <noreply@belcoda.com>',
					template: 'transactional',
					stream: 'outbound',
					context: email
				});
			}
		},
		socialProviders: {
			google: {
				clientId: publicEnv.PUBLIC_GOOGLE_AUTH_CLIENT_ID as string,
				clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET as string
			}
		},
		database: drizzleAdapter(drizzle, {
			provider: 'pg', // or "mysql", "sqlite"
			schema: {
				...schema,
				apikey: schema.apiKey // Map apiKey table to the name better-auth expects
			}
		}),
		trustedOrigins: [
			publicEnv.PUBLIC_ROOT_DOMAIN,
			'https://app.belcoda.com',
			'https://staging.belcoda.com',
			'http://localhost:5173',
			'https://belcoda-zero.fly.dev',
			`.${publicEnv.PUBLIC_ROOT_DOMAIN}`
		],
		session: {
			storeSessionInDatabase: true,
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60 // Cache duration in seconds
			}
		},
		advanced: {
			database: {
				generateId: () => {
					return uuidv7();
				}
			},
			cookiePrefix: 'belcoda',
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] // Cloudflare specific header
			}
		},
		plugins: [
			organization({
				schema: {
					organization: {
						additionalFields: {
							icon: {
								type: 'string',
								input: true,
								required: false
							},
							country: {
								type: 'string',
								input: true,
								required: true
							},
							defaultLanguage: {
								type: 'string',
								input: true,
								required: true
							},
							defaultTimezone: {
								type: 'string',
								input: true
							},
							settings: {
								type: 'json',
								input: true,
								required: true
							},
							balance: {
								type: 'number',
								input: true,
								required: true
							}
						}
					}
				}
			}),
			sveltekitCookies(getRequestEvent),
			openAPI(),
			apiKey({
				storage: 'secondary-storage',
				fallbackToDatabase: true
			}),
			stripe({
				stripeClient,
				stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
				createCustomerOnSignUp: true
			}),
			oneTimeToken()
		],
		emailVerification: {
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url, token }, request) => {
				const email = emailVerification({ url, locale });
				await sendTemplateEmail({
					to: user.email,
					from: 'Belcoda <noreply@belcoda.com>',
					template: 'transactional',
					stream: 'outbound',
					context: email
				});
			}
		},
		user: {
			additionalFields: {
				preferredLanguage: {
					type: 'string',
					input: true,
					required: false
				}
			}
		},
		subscription: {
			// ... other subscription options
			authorizeReference: async ({
				user,
				referenceId,
				action
			}: {
				user: any;
				referenceId: string;
				action: any;
			}) => {
				const member = await drizzle.query.member.findFirst({
					where: (row, { eq, and }) =>
						and(eq(row.userId, user.id), eq(row.organizationId, referenceId))
				});
				if (!member) return false;

				return member.role === 'owner';
			}
		},
		secondaryStorage: {
			get: async (key: string) => {
				const value = cache.get(key);
				if (!value) {
					return null;
				}
				return value;
			},
			set: async (key: string, value: string) => {
				cache.set(key, value);
			},
			delete: async (key: string) => {
				cache.delete(key);
			}
		}
	});
}
