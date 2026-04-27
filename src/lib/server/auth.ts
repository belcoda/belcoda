import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

import { openAPI, organization } from 'better-auth/plugins';
import { oneTimeToken } from 'better-auth/plugins/one-time-token';

import { apiKey } from '@better-auth/api-key';
import { stripe } from '@better-auth/stripe';
import type Stripe from 'stripe';
import { getQueue } from '$lib/server/queue';
import { stripeClient } from '$lib/server/stripe';
import {
	CREDIT_PURCHASE_METADATA_TYPE,
	parseCreditPurchaseAmountUsd
} from '$lib/utils/billing/credit';

import { parse } from 'valibot';
import { userRole } from '$lib/schema/user';
import pino from '$lib/pino';
const log = pino(import.meta.url);

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
import { organizationSettingsSchema } from '$lib/schema/organization/settings';

import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { emailVerification } from '$lib/server/utils/email/context/transactional/auth/verify_email';
import { passwordReset } from '$lib/server/utils/email/context/transactional/auth/password_reset';
import { organizationInvitation } from '$lib/server/utils/email/context/transactional/auth/organization_invitation';

async function canManageOrganizationBilling({
	userId,
	referenceId
}: {
	userId: string;
	referenceId: string;
}) {
	const member = await drizzle.query.member.findFirst({
		where: (row, { eq, and }) => and(eq(row.userId, userId), eq(row.organizationId, referenceId))
	});
	if (!member) {
		return false;
	}
	return member.role === 'owner';
}

async function applyCreditTopUpFromStripeEvent(event: Stripe.Event) {
	if (event.type !== 'checkout.session.completed') {
		return;
	}

	const checkoutSession = event.data.object as Stripe.Checkout.Session;
	if (checkoutSession.mode !== 'payment' || checkoutSession.payment_status !== 'paid') {
		return;
	}

	if (checkoutSession.metadata?.type !== CREDIT_PURCHASE_METADATA_TYPE) {
		return;
	}

	const organizationId = checkoutSession.metadata.organizationId;
	const creditAmount = parseCreditPurchaseAmountUsd(checkoutSession.metadata.creditAmount);
	if (!organizationId || !creditAmount) {
		return;
	}

	await drizzle
		.update(schema.organization)
		.set({
			balance: sql`${schema.organization.balance} + ${creditAmount}`,
			updatedAt: new Date()
		})
		.where(eq(schema.organization.id, organizationId));
}

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
			provider: 'pg',
			schema: {
				...schema,
				apikey: schema.apiKey // Map apiKey table to the name better-auth expects
			}
		}),
		trustedOrigins: [
			publicEnv.PUBLIC_ROOT_DOMAIN as string,
			'https://app.belcoda.com',
			'https://staging.belcoda.com',
			'http://localhost:5173',
			'https://belcoda-zero.fly.dev',
			'https://zero.staging.belcoda.com',
			'https://zero.app.belcoda.com',
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
			// Only use crossSubDomainCookies on belcoda.com; on localhost it would set
			// cookie domain=.belcoda.com, causing the OAuth state cookie to not be sent back
			crossSubDomainCookies:
				publicEnv.PUBLIC_ROOT_DOMAIN?.includes('localhost') ||
				publicEnv.PUBLIC_ROOT_DOMAIN?.includes('127.0.0.1')
					? { enabled: false }
					: { enabled: true, domain: `.belcoda.com` },
			cookiePrefix: 'belcoda',
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] // Cloudflare specific header
			}
		},
		plugins: [
			organization({
				async sendInvitationEmail(data) {
					const inviteLink = `${publicEnv.PUBLIC_HOST}/signup?invitationEmail=${encodeURIComponent(data.email)}&invitationOrganizationName=${encodeURIComponent(data.organization.name)}`;
					const email = organizationInvitation({
						url: inviteLink,
						inviterName: data.inviter.user.name,
						organizationName: data.organization.name,
						locale,
						orgIcon: data.organization.logo
					});
					await sendTemplateEmail({
						to: data.email,
						from: 'Belcoda <noreply@belcoda.com>',
						template: 'transactional',
						stream: 'outbound',
						context: email
					});
				},
				organizationHooks: {
					afterAddMember: async ({ member, user, organization }) => {
						//trigger webhook
						try {
							const queue = await getQueue();
							await queue.triggerWebhook({
								organizationId: organization.id,
								payload: {
									type: 'member.created',
									data: {
										organizationId: organization.id,
										userId: user.id,
										role: parse(userRole, member.role)
									}
								}
							});
						} catch (error) {
							log.error({ error, member, user, organization }, 'Failed to trigger webhook');
						}
					},
					afterRemoveMember: async ({ user, organization }) => {
						//trigger webhook
						try {
							const queue = await getQueue();
							await queue.triggerWebhook({
								organizationId: organization.id,
								payload: {
									type: 'member.deleted',
									data: {
										organizationId: organization.id,
										userId: user.id
									}
								}
							});
						} catch (error) {
							log.error({ error, user, organization }, 'Failed to trigger webhook');
						}
					},
					afterUpdateMemberRole: async ({ member, user, organization }) => {
						//trigger webhook
						try {
							const queue = await getQueue();
							await queue.triggerWebhook({
								organizationId: organization.id,
								payload: {
									type: 'member.updated',
									data: {
										organizationId: organization.id,
										userId: user.id,
										role: parse(userRole, member.role)
									}
								}
							});
						} catch (error) {
							log.error({ error, member, user, organization }, 'Failed to trigger webhook');
						}
					}
				},
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
								validator: {
									input: organizationSettingsSchema,
									output: organizationSettingsSchema
								},
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
				fallbackToDatabase: true,
				references: 'organization'
			}),
			stripe({
				stripeClient,
				stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET as string,
				createCustomerOnSignUp: true,
				subscription: {
					enabled: true,
					plans: [
						{
							name: 'supported',
							priceId: env.STRIPE_SUPPORTED_TIER_PRICE_ID
						},
						{
							name: 'enterprise',
							priceId: env.STRIPE_ENTERPRISE_TIER_PRICE_ID
						}
					],
					authorizeReference: async ({ user, referenceId }) => {
						return canManageOrganizationBilling({
							userId: user.id,
							referenceId
						});
					}
				},
				onEvent: async (event) => {
					await applyCreditTopUpFromStripeEvent(event);
				}
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

export type BetterAuth = ReturnType<typeof buildBetterAuth>;
