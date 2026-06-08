import { t } from '$lib/index.svelte';
import type {
	UpdateWhatsappBusinessProfileInput,
	WhatsappBusinessAccountSummary,
	WhatsappBusinessProfile,
	WhatsappProfileAndAccountResponse
} from '$lib/schema/whatsapp/ycloud/profile';

let profile = $state<WhatsappBusinessProfile | null>(null);
let waba = $state<WhatsappBusinessAccountSummary | null>(null);
let loading = $state(false);
let saving = $state(false);
let error = $state<string | null>(null);
let loadedOrganizationId = $state<string | null>(null);
let inFlight: Promise<void> | null = null;
let inFlightOrganizationId: string | null = null;

function profileUrl(organizationId: string) {
	return `/api/utils/whatsapp/profile?organizationId=${encodeURIComponent(organizationId)}`;
}

function reset() {
	profile = null;
	waba = null;
	loading = false;
	saving = false;
	error = null;
	loadedOrganizationId = null;
	inFlight = null;
	inFlightOrganizationId = null;
}

async function fetchProfile(organizationId: string) {
	loading = true;
	error = null;
	try {
		const response = await fetch(profileUrl(organizationId));
		if (!response.ok) {
			const message = await response.text();
			throw new Error(message || t`Failed to load WhatsApp business profile`);
		}
		const data = (await response.json()) as WhatsappProfileAndAccountResponse;
		if (inFlightOrganizationId !== organizationId) {
			return;
		}
		profile = data.profile;
		waba = data.waba;
		loadedOrganizationId = organizationId;
	} catch (err) {
		if (inFlightOrganizationId !== organizationId) {
			return;
		}
		profile = null;
		waba = null;
		loadedOrganizationId = null;
		error = err instanceof Error ? err.message : t`Failed to load WhatsApp business profile`;
	} finally {
		if (inFlightOrganizationId === organizationId) {
			loading = false;
			inFlight = null;
			inFlightOrganizationId = null;
		}
	}
}

export const whatsappAccountState = {
	get profile() {
		return profile;
	},
	get waba() {
		return waba;
	},
	get loading() {
		return loading;
	},
	get saving() {
		return saving;
	},
	get error() {
		return error;
	},
	get loadedOrganizationId() {
		return loadedOrganizationId;
	},

	async load(organizationId: string) {
		if (loadedOrganizationId === organizationId && profile !== null && waba !== null) {
			return;
		}

		if (loadedOrganizationId !== organizationId) {
			profile = null;
			waba = null;
			loadedOrganizationId = null;
			error = null;
		}

		if (inFlight && inFlightOrganizationId === organizationId) {
			return inFlight;
		}

		inFlightOrganizationId = organizationId;
		inFlight = fetchProfile(organizationId);
		return inFlight;
	},

	async saveProfile(organizationId: string, input: UpdateWhatsappBusinessProfileInput) {
		saving = true;
		error = null;
		try {
			const response = await fetch(profileUrl(organizationId), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			});
			if (!response.ok) {
				const message = await response.text();
				throw new Error(message || t`Failed to save WhatsApp business profile`);
			}
			const data = (await response.json()) as WhatsappBusinessProfile;
			if (loadedOrganizationId !== organizationId) {
				return data;
			}
			profile = data;
			return data;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : t`Failed to save WhatsApp business profile`;
			if (loadedOrganizationId === organizationId) {
				error = message;
			}
			throw err instanceof Error ? err : new Error(message);
		} finally {
			saving = false;
		}
	},

	reset
};
