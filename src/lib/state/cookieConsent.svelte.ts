const COOKIE_NAME = 'belcoda_cookie_consent';
type ConsentState = 'accepted' | 'rejected' | null;

function getCookieValue(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
	return match ? decodeURIComponent(match[2]) : null;
}

function setCookieValue(name: string, value: string) {
	if (typeof document === 'undefined') return;
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

function createConsentStore() {
	let state = $state<ConsentState>(getCookieValue(COOKIE_NAME) as ConsentState);

	return {
		get value() {
			return state;
		},
		get accepted() {
			return state === 'accepted';
		},
		get rejected() {
			return state === 'rejected';
		},
		get decided() {
			return state !== null;
		},
		accept() {
			state = 'accepted';
			setCookieValue(COOKIE_NAME, 'accepted');
		},
		reject() {
			state = 'rejected';
			setCookieValue(COOKIE_NAME, 'rejected');
		}
	};
}

export const cookieConsent = createConsentStore();
