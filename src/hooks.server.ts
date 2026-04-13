import * as Sentry from '@sentry/sveltekit';
import type { Handle, RequestEvent } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';
const { PUBLIC_ROOT_DOMAIN } = env;
import { env as privateEnv } from '$env/dynamic/private';
const { EASYCRON_SECRET } = privateEnv;
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { error, json, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

import { detectSubdomain } from '$lib/utils/routing';
import pino from '$lib/pino';
const log = pino(import.meta.url);

import { sequence } from '@sveltejs/kit/hooks';
import { LOCALES, type Locale } from '$lib/utils/language';
import { buildBetterAuth } from '$lib/server/auth';

import * as main from './locales/main.loader.server.svelte.js';
import * as js from './locales/js.loader.server.js';
import { runWithLocale, loadLocales } from 'wuchale/load-utils/server';
import { locales } from './locales/data.js';

// load at server startup
loadLocales(main.key, main.loadIDs, main.loadCatalog, locales);
loadLocales(js.key, js.loadIDs, js.loadCatalog, locales);

/**
 * Determine the locale for an incoming request by consulting a locale cookie and optional URL override.
 *
 * Checks the `BELCODA_LOCALE` cookie and, if its value is a supported locale, returns the `locale` URL
 * search parameter when present and supported; otherwise returns the cookie value. If neither provides
 * a supported locale, falls back to `'en'`.
 *
 * @param event - The incoming RequestEvent containing `url` and `cookies`
 * @returns The selected `Locale` for the request; `'en'` if no supported locale is found
 */
function detectLocale(event: RequestEvent): Locale {
	log.debug({ url: event.url.toString() }, 'New incoming request');
	if (event.cookies.get('BELCODA_LOCALE')) {
		if (LOCALES.includes(event.cookies.get('BELCODA_LOCALE')! as Locale)) {
			//check if url param overrides cookie
			if (event.url.searchParams.get('locale')) {
				if (LOCALES.includes(event.url.searchParams.get('locale')! as Locale)) {
					return event.url.searchParams.get('locale')! as Locale;
				}
			} else {
				return event.cookies.get('BELCODA_LOCALE')! as Locale;
			}
		}
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
	if (
		event.url.pathname.startsWith('/login') ||
		event.url.pathname.startsWith('/signup') ||
		event.url.pathname.startsWith('/logout') ||
		event.url.pathname.startsWith('/api/docs') ||
		event.url.pathname.startsWith('/verify-email') ||
		event.url.pathname.startsWith('/api/auth') || //this is for the better-auth api which handles its own authentication
		event.url.pathname.startsWith('/api/e2e') || // E2E testing endpoints (dev only)
		event.url.pathname.startsWith('/webhooks') ||
		event.url.pathname.startsWith('/sentry-example-page')
	) {
		log.debug(`Handling public route: ${event.url.pathname}`);

		if (event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/signup')) {
			if (event.locals.session) {
				log.debug('Redirecting to home because user is already logged in');
				return redirect(302, '/');
			}
		}
		return resolve(event);
	}

	if (event.url.pathname.startsWith('/api/cron')) {
		if (event.request.headers.get('x-api-key') == EASYCRON_SECRET) {
			return resolve(event);
		} else {
			return error(401, 'Unauthorized: API key not valid for cron');
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
	if (event.url.searchParams.get('authToken')) {
		const token = event.url.searchParams.get('authToken');
		if (token) {
			try {
				log.debug({ token, url: event.url.toString() }, 'Token found in search params on route');
				const session = await auth.api.verifyOneTimeToken({
					body: {
						token: token
					}
				});
				/* event.url.searchParams.delete('authToken'); //kill the token so it can't be used again
																log.debug({ url: event.url.toString() }, '[DEBUG] Token deleted from search params'); */
				log.debug({ session, time: Date.now() }, '[DEBUG] Session verified from one time token');
				event.locals.session = session;
			} catch (error) {
				log.error(error, 'Error verifying one time token');
			}
		}
	}

	if (event.request.headers.get('x-api-key')) {
		const key = await auth.api.verifyApiKey({
			body: {
				key: event.request.headers.get('x-api-key')!
			}
		});
		if (key.valid) {
			event.locals.authorizedApiOrganization = key.key?.referenceId || null; //organizationId by default
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Anti-clickjacking protection
	// response.headers.set('X-Frame-Options', 'DENY'); //can't use yet, as we still need framing for google oauth

	// HSTS - Force HTTPS for 1 year
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

	// Prevent MIME sniffing
	response.headers.set('X-Content-Type-Options', 'nosniff');

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
	event.locals.authorizedApiUser = null;
	return resolve(event);
};

// No handleFetch export: same-origin / internal fetch is not rewritten to another host (Task 2 audit).

export const handle = sequence(Sentry.sentryHandle(), handleSkipToAppResolution);
export const handleError = Sentry.handleErrorWithSentry();
