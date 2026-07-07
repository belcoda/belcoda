import * as Sentry from '@sentry/sveltekit';
import type { Handle, RequestEvent } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';
const {
	PUBLIC_ROOT_DOMAIN,
	PUBLIC_ZERO_SERVER,
	PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME,
	PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_REGION
} = env;
import { env as privateEnv } from '$env/dynamic/private';
const { EASYCRON_SECRET, NODE_ENV } = privateEnv;
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { json, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

import { detectSubdomain } from '$lib/utils/routing';
import pino from '$lib/pino';
const log = pino(import.meta.url);

import { sequence } from '@sveltejs/kit/hooks';
import { LOCALES, type Locale } from '$lib/utils/language';
import { buildBetterAuth } from '$lib/server/auth';
import {
	augmentContentSecurityPolicy,
	getZeroSyncConnectSources,
	getS3UploadConnectSources,
	isPublicEmbedPage
} from '$lib/server/csp';

import * as main from './locales/main.loader.server.svelte.js';
import * as js from './locales/js.loader.server.js';
import { runWithLocale, loadLocales } from 'wuchale/load-utils/server';
import { locales } from './locales/data.js';

// load at server startup
loadLocales(main.key, main.loadCount, main.loadCatalog, locales);
loadLocales(js.key, js.loadCount, js.loadCatalog, locales);

/**
 * Determine the locale for an incoming request by consulting a locale cookie and optional URL override.
 *
 * Reads `BELCODA_LOCALE` and the `locale` search param. If the cookie is a supported locale, a valid
 * `locale` param overrides it; an invalid param keeps the cookie. If the cookie is not supported, a
 * valid `locale` param is used. Falls back to `'en'` only when neither source yields a supported locale.
 *
 * @param event - The incoming RequestEvent containing `url` and `cookies`
 * @returns The selected `Locale` for the request; `'en'` if no supported locale is found
 */
function detectLocale(event: RequestEvent): Locale {
	log.debug({ url: event.url.toString() }, 'New incoming request');
	const cookieLocale = event.cookies.get('BELCODA_LOCALE');
	const paramLocale = event.url.searchParams.get('locale');

	const isSupported = (value: string | null | undefined): value is Locale =>
		value != null && value !== '' && LOCALES.includes(value as Locale);

	const cookieOk = isSupported(cookieLocale);
	const paramOk = isSupported(paramLocale);

	if (cookieOk) {
		if (paramLocale !== null) {
			return paramOk ? paramLocale : cookieLocale;
		}
		return cookieLocale;
	}

	if (paramOk) {
		return paramLocale;
	}

	return 'en';
}

/**
 * Determines whether a request pathname targets compiled app internals or static/root files that should bypass auth, locale, and session middleware.
 *
 * @returns `true` if `pathname` refers to an internal or static asset (e.g. `/_app/...`, `/static/...`, `/favicon.ico`, `/robots.txt`), `false` otherwise.
 */
function isInternalOrStaticAssetPath(pathname: string): boolean {
	return (
		pathname.startsWith('/_app/') ||
		pathname.startsWith('/static/') ||
		pathname === '/favicon.ico' ||
		pathname === '/robots.txt'
	);
}

/**
 * Determines whether a request pathname targets a public route or webhook that is handled without
 * the standard authenticated-session middleware (these authenticate themselves where needed).
 */
function isPublicRoutePath(pathname: string): boolean {
	return (
		pathname === '/login' ||
		pathname.startsWith('/login/') ||
		pathname === '/signup' ||
		pathname.startsWith('/signup/') ||
		pathname === '/logout' ||
		pathname === '/verify-email' ||
		pathname.startsWith('/verify-email/') ||
		pathname === '/api/docs' ||
		pathname.startsWith('/api/docs/') ||
		pathname === '/api/auth' ||
		pathname.startsWith('/api/auth/') || //this is for the better-auth api which handles its own authentication
		// E2E testing endpoints — fail closed: only public under an explicit dev/test allowlist
		((NODE_ENV === 'development' || NODE_ENV === 'test') &&
			(pathname === '/api/e2e' || pathname.startsWith('/api/e2e/'))) ||
		pathname === '/webhooks' ||
		pathname.startsWith('/webhooks/') ||
		pathname === '/sentry-example-page' ||
		pathname.startsWith('/sentry-example-page/')
	);
}

/**
 * For an already-identified public route, redirects an already-authenticated user away from the
 * login/signup pages. Calls `redirect()` (which interrupts the handler) when applicable; otherwise
 * returns normally so the request continues to be resolved.
 */
function applyPublicRouteRedirect(event: RequestEvent): void {
	if (!event.url.pathname.startsWith('/login') && !event.url.pathname.startsWith('/signup')) {
		return;
	}
	if (!event.locals.session) {
		return;
	}
	// this is an invitation email, but there is already an existing session, so the user has an account
	if (event.url.pathname.startsWith('/signup') && event.url.searchParams.get('invitationEmail')) {
		// redirect to the organization page, where you can view and accept/reject invitations
		redirect(302, '/organization');
	}

	log.debug('Redirecting to home because user is already logged in');
	redirect(302, '/');
}

const handleRequest: Handle = async ({ event, resolve }) => {
	event.locals.requestId = uuidv4();
	const subdomainOrFalse = detectSubdomain(event.url.host, PUBLIC_ROOT_DOMAIN);
	log.debug(
		{
			path: event.url.pathname,
			session: event.locals.session?.session.id || 'NO SESSION',
			locale: event.locals.locale,
			method: event.request.method,
			requestId: event.locals.requestId,
			host: event.url.host,
			subdomain: subdomainOrFalse,
			searchParams: event.url.searchParams.toString()
		},
		'Incoming request'
	);
	// Handle all routes that we can deal with unauthenticated. These should be public routes and webhooks that we authenticate separately.
	if (isPublicRoutePath(event.url.pathname)) {
		log.debug(`Handling public route: ${event.url.pathname}`);
		applyPublicRouteRedirect(event);
		return resolve(event);
	}

	if (event.url.pathname.startsWith('/api/cron')) {
		if (event.request.headers.get('x-api-key') == EASYCRON_SECRET) {
			return resolve(event);
		} else {
			return json({ error: 'Unauthorized: API key not valid for cron' }, { status: 401 });
		}
	}

	// Handle the page routes (eg: event pages, etc) which should always be on a subdomain and don't need to be authenticated...
	if (subdomainOrFalse) {
		log.debug(
			{ url: event.url.toString() },
			'Handling page route on subdomain: ' + subdomainOrFalse
		);
		const resolved = await resolve(event);
		log.debug(
			{ url: event.url.toString(), session: event.locals.session?.session.id },
			'[DEBUG] Page route resolved'
		);
		return resolved; //Note: There *may* be a valid session here, but not for sure...
	}

	// check API key if it's an API route
	if (event.url.pathname.startsWith('/api/v1/')) {
		if (!event.locals.authorizedApiOrganization) {
			return json({ error: 'Unauthorized: API key not valid for organization' }, { status: 401 });
		}
		return resolve(event);
	}

	// if no session, redirect to signup
	if (!event.locals.session) {
		const isData = event.isDataRequest || event.url.pathname.endsWith('/__data.json');
		if (isData) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return redirect(302, '/signup');
	}
	// from here on, we have a session
	log.debug('Authenticated route');

	return await resolve(event);
};

type BetterAuth = ReturnType<typeof buildBetterAuth>;

/**
 * If an `authToken` search param is present, verifies it as a one-time token and, on success, sets
 * `event.locals.session` to the resulting session, then redirects to the same URL with `authToken`
 * removed so the browser no longer holds the single-use token (which would otherwise 500 on reuse
 * from a refresh or follow-up data request). Verification failures are logged and otherwise ignored,
 * leaving the previously-fetched session in place. This runs for both event and petition public
 * pages, keeping their token handling identical.
 */
async function applyOneTimeTokenSession(event: RequestEvent, auth: BetterAuth): Promise<void> {
	const token = event.url.searchParams.get('authToken');
	if (!token) {
		return;
	}
	let verified = false;
	try {
		log.debug({ pathname: event.url.pathname }, 'One-time auth token found in search params');
		const session = await auth.api.verifyOneTimeToken({
			body: {
				token: token
			}
		});
		log.debug(
			{ verified: session?.session != null, time: Date.now() },
			'[DEBUG] Session verified from one time token'
		);
		event.locals.session = session;
		verified = true;
	} catch (error) {
		log.error(error, 'Error verifying one time token');
	}
	// Redirect outside the try/catch so the thrown redirect is not swallowed by error handling.
	if (verified) {
		const cleanedUrl = new URL(event.url);
		cleanedUrl.searchParams.delete('authToken'); //kill the token so it can't be reused
		log.debug({ url: cleanedUrl.toString() }, '[DEBUG] Redirecting to strip one-time token');
		redirect(303, cleanedUrl.pathname + cleanedUrl.search + cleanedUrl.hash);
	}
}

/**
 * For `/api/v1/` requests carrying an `x-api-key` header, verifies the API key. On success, records
 * the authorized organization on `event.locals`. On failure, returns a JSON error `Response`
 * (429 for rate limiting, 401 otherwise). Returns `null` when there is nothing to handle or the key
 * is valid, signalling the request should continue.
 */
async function checkApiKeyAuth(event: RequestEvent, auth: BetterAuth): Promise<Response | null> {
	if (!event.request.headers.get('x-api-key') || !event.url.pathname.startsWith('/api/v1/')) {
		return null;
	}
	const key = await auth.api.verifyApiKey({
		body: {
			key: event.request.headers.get('x-api-key')!
		}
	});
	if (key.valid) {
		event.locals.authorizedApiOrganization = key.key?.referenceId || null; //organizationId by default
		return null;
	}
	if (key.error?.code === 'RATE_LIMITED') {
		let tryAgainText = 'Try again later';
		//@ts-expect-error (typing on this seems wrong, it thinks that it shouldn't have details  but does in practice)
		if (key.error?.details?.tryAgainIn) {
			//@ts-expect-error (typing on this seems wrong, it thinks that it shouldn't have details  but does in practice)
			tryAgainText = `Try again in ${Math.ceil(key.error?.details?.tryAgainIn / 1000)} seconds`;
		}
		return json(
			{
				error: `${key.error?.code}: ${key.error?.message || 'Rate limit exceeded'} (${tryAgainText})`
			},
			{ status: 429 }
		);
	}
	// this is actually the default case if the error is in checking the API key
	return json({ error: key.error?.message || 'Invalid API key' }, { status: 401 });
}

const handlebetterAuth: Handle = async ({ event, resolve }) => {
	// Fetch current session from Better Auth
	const auth = buildBetterAuth(event.locals.locale);
	event.locals.session = await auth.api.getSession({
		headers: event.request.headers
	});
	log.debug(
		{ session: event.locals.session?.session.id, time: Date.now() },
		'[DEBUG] Session fetched from Better Auth'
	);

	await applyOneTimeTokenSession(event, auth);

	// check better-api auth routes
	const apiKeyResponse = await checkApiKeyAuth(event, auth);
	if (apiKeyResponse) {
		return apiKeyResponse;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// HSTS - Force HTTPS for 1 year
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

	// Prevent MIME sniffing
	response.headers.set('X-Content-Type-Options', 'nosniff');

	// Limit referrer data shared with external origins
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Cross-Origin Resource Policy
	// Don't set CORP for static assets (/_app/immutable/*) to avoid preload issues in strict browsers
	// See: https://github.com/belcoda/belcoda/issues/BELCODA-2G
	if (!event.url.pathname.startsWith('/_app/immutable/')) {
		response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	}

	// Permissions Policy - Restrict browser features
	const permissionsPolicies = [
		'camera=()',
		'microphone=()',
		'geolocation=()',
		'payment=()',
		'usb=()',
		'magnetometer=()',
		'gyroscope=()',
		'accelerometer=()'
	].join(', ');
	response.headers.set('Permissions-Policy', permissionsPolicies);

	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('text/html')) {
		response.headers.set('Cache-Control', 'no-cache');

		const csp = response.headers.get('Content-Security-Policy');
		if (csp) {
			const augmented = augmentContentSecurityPolicy(csp, {
				extraConnectSources: [
					...getZeroSyncConnectSources(PUBLIC_ZERO_SERVER),
					...getS3UploadConnectSources(
						PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME,
						PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_REGION
					)
				],
				allowEmbedding: isPublicEmbedPage(event.url.pathname, event.url.searchParams, {
					host: event.url.host,
					rootDomain: PUBLIC_ROOT_DOMAIN
				})
			});
			response.headers.set('Content-Security-Policy', augmented);
		}
	}

	return response;
};

const handleLocale: Handle = async ({ event, resolve }) => {
	const locale = detectLocale(event);
	event.locals.locale = locale;
	return await runWithLocale(locale, () => resolve(event));
};

/**
 * Auth, locale, and security run inside this chain. Static/internal assets skip it entirely
 * (see `handleSkipToAppResolution`) so `resolve()` reaches SvelteKit without session redirects.
 * `__data.json` / `isDataRequest` stay in this chain so `handlebetterAuth` can set `locals.session`;
 * unauthenticated data requests are handled in `handleRequest` (401 JSON, not redirect).
 */
const handleAppChain = sequence(
	handleLocale,
	handleSecurityHeaders,
	handlebetterAuth,
	handleRequest
);

/**
 * After Sentry: compiled assets and `/static/*` bypass the app hook chain. Using `sequence()` alone
 * would still run later hooks because inner `resolve` advances the sequence — wrapping avoids that.
 */
const handleSkipToAppResolution: Handle = async ({ event, resolve }) => {
	if (!isInternalOrStaticAssetPath(event.url.pathname)) {
		return handleAppChain({ event, resolve });
	}
	event.locals.requestId = uuidv4();
	event.locals.locale = detectLocale(event);
	event.locals.session = null;
	event.locals.authorizedApiOrganization = null;
	return resolve(event);
};

// No handleFetch export: same-origin / internal fetch is not rewritten to another host (Task 2 audit).

export const handle = sequence(Sentry.sentryHandle(), handleSkipToAppResolution);
export const handleError = Sentry.handleErrorWithSentry();
