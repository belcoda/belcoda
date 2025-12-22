// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
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
