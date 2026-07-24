// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		gtag?: (
			command: 'event',
			action: string,
			parameters: {
				send_to: string;
				value?: number;
				currency?: string;
			}
		) => void;
	}

	namespace App {
		interface Error {
			message: string;
			/** Sentry event id when available (for support correlation). */
			errorId?: string;
			/** Extra detail for developers (only set in dev from `hooks.client.ts`). */
			debug?: string;
		}
		interface Locals {
			locale: import('$lib/utils/language').Locale;
			requestId: string;
			session: Awaited<
				ReturnType<
					ReturnType<(typeof import('$lib/server/auth'))['buildBetterAuth']>['api']['getSession']
				>
			>;
			authorizedApiOrganization: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
