import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';
import { dev } from '$app/environment';
Sentry.init({
	dsn: env.PUBLIC_SENTRY_DSN,

	tracesSampleRate: 1.0,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
	sendDefaultPii: true
});

/**
 * Produce a user-facing error message appropriate for display in the UI.
 *
 * @param error - The original error value (may be an Error, string, or other value)
 * @param kitMessage - Framework-provided message; used when it is present and not a generic placeholder
 * @param status - HTTP status code used to choose a generic server-side vs client-side message
 * @returns A readable message for end users: prefers a non-generic `kitMessage`, maps fetch/load failures to a connectivity prompt, uses `Error.message` or string errors when available, and falls back to a status-appropriate generic message
 */
function userFacingMessage(error: unknown, kitMessage: string, status: number): string {
	if (kitMessage && kitMessage !== 'Internal Error' && kitMessage !== 'Error') {
		return kitMessage;
	}
	if (error instanceof Error) {
		const m = error.message;
		if (/load failed|failed to fetch/i.test(error.message)) {
			return 'Could not load this page. Check your connection and try again.';
		}
		if (dev) {
			return m;
		}
	}
	if (typeof error === 'string' && error && dev) {
		//only return error in dev (ie: not to the user)
		return error;
	}
	return status >= 500
		? 'Something went wrong on our side. Please try again.'
		: 'Something went wrong. Please try again.';
}

const logAndShapeError: HandleClientError = ({ error, event, status, message }) => {
	// Full context for DevTools / support — not shown to end users verbatim.
	console.error('[client handleError]', {
		status,
		message,
		url: event?.url?.href,
		routeId: event?.route?.id,
		error
	});

	const errorId = Sentry.lastEventId();
	const payload: App.Error = {
		message: userFacingMessage(error, message, status),
		...(errorId ? { errorId } : {})
	};

	if (dev) {
		const debug =
			error instanceof Error
				? `${error.name}: ${error.message}\n${error.stack ?? ''}`
				: typeof error === 'object' && error !== null
					? JSON.stringify(error, null, 2)
					: String(error);
		payload.debug = debug;
	}

	return payload;
};

export const handleError = handleErrorWithSentry(logAndShapeError);
