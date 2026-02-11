export type ApiKeyDisplay = {
	id: string;
	name: string;
	start: string; // First few characters of the key from better-auth
	createdAt: string | Date;
	expiresAt: string | Date | null;
	enabled: boolean;
};

/**
 * Mask an API key for display.
 * Shows the start characters (provided by better-auth) followed by "..."
 * @param key - API key object with start property
 * @returns Masked key string (e.g., "bel_abc123...")
 */
export function maskApiKey(key: ApiKeyDisplay): string {
	const start = key.start || '';
	// better-auth provides the 'start' property which shows first few characters
	// We show that + "..." since we don't have access to the full key after creation
	return `${start}...`;
}
