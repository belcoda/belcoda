// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
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
			authorizedApiUser: string | null;
			authorizedApiOrganization: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
