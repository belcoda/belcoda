import { db } from '$lib/server/db';
import { _getEventByIdUnsafeNoTenantCheck } from '$lib/server/api/data/event/event';
import { _getPersonByIdUnsafeNoTenantCheck } from '$lib/server/api/data/person/person';
import { _getEmailMessageByIdUnsafeNoTenantCheck } from '$lib/server/api/data/email/message';
import { _getWhatsappThreadByIdUnsafeNoTenantCheck } from '$lib/server/api/data/whatsapp/thread';
import { _getPetitionByIdUnsafeNoTenantCheck } from '$lib/server/api/data/petition/petition';
export async function inferOrganizationIdFromUrl({ url }: { url: URL }): Promise<string | null> {
	const path = url.pathname;

	//COMMUNICATIONS
	const emailDraftId = checkIfPathStartsWithPattern(path, '/communications/email/drafts/[uuid]');
	if (emailDraftId) {
		return await db.transaction(async (tx) => {
			return await _getEmailMessageByIdUnsafeNoTenantCheck({
				emailMessageId: emailDraftId,
				tx
			});
		});
	}
	const emailSentId = checkIfPathStartsWithPattern(path, '/communications/email/sent/[uuid]');
	if (emailSentId) {
		return await db.transaction(async (tx) => {
			return await _getEmailMessageByIdUnsafeNoTenantCheck({
				emailMessageId: emailSentId,
				tx
			});
		});
	}

	const whatsappDraftId = checkIfPathStartsWithPattern(
		path,
		'/communications/whatsapp/drafts/[uuid]'
	);
	if (whatsappDraftId) {
		return await db.transaction(async (tx) => {
			const whatsappThread = await _getWhatsappThreadByIdUnsafeNoTenantCheck({
				whatsappThreadId: whatsappDraftId,
				tx
			});
			if (!whatsappThread) {
				return null;
			}
			return whatsappThread.organizationId;
		});
	}
	const whatsappSentId = checkIfPathStartsWithPattern(path, '/communications/whatsapp/sent/[uuid]');
	if (whatsappSentId) {
		return await db.transaction(async (tx) => {
			const whatsappThread = await _getWhatsappThreadByIdUnsafeNoTenantCheck({
				whatsappThreadId: whatsappSentId,
				tx
			});
			if (!whatsappThread) {
				return null;
			}
			return whatsappThread.organizationId;
		});
	}
	//COMMUNITY
	const personId = checkIfPathStartsWithPattern(path, '/community/[uuid]');
	if (personId) {
		return await db.transaction(async (tx) => {
			return await _getPersonByIdUnsafeNoTenantCheck({ personId, tx });
		});
	}
	//EVENTS
	const eventId = checkIfPathStartsWithPattern(path, '/events/[uuid]');
	if (eventId) {
		return await db.transaction(async (tx) => {
			const event = await _getEventByIdUnsafeNoTenantCheck({ eventId, tx });
			return event?.organizationId ?? null;
		});
	}
	//PETITIONS
	const petitionId = checkIfPathStartsWithPattern(path, '/petitions/[uuid]');
	if (petitionId) {
		return await db.transaction(async (tx) => {
			const petition = await _getPetitionByIdUnsafeNoTenantCheck({ petitionId, tx });
			if (!petition) {
				return null;
			}
			return petition.organizationId;
		});
	}
	return null;
}

/**
 * Checks if a given path matches a pattern containing a [uuid] placeholder at the
 * first dynamic segment. If it matches, returns the extracted UUID; otherwise,
 * returns null. The UUID must be followed by end-of-string or a path segment
 * boundary (next `/`), so suffix garbage like `uuidfoo` does not match.
 *
 * Example usage:
 * ```ts
 * const path1 = '/communications/drafts/123e4567-e89b-12d3-a456-426614174000';
 * const path2 = '/communications/drafts/123e4567-e89b-12d3-a456-426614174000/edit';
 * const pattern = '/communications/drafts/[uuid]';
 *
 * console.log(checkIfPathStartsWithPattern(path1, pattern));
 * // Output: 123e4567-e89b-12d3-a456-426614174000
 *
 * console.log(checkIfPathStartsWithPattern(path2, pattern));
 * // Output: 123e4567-e89b-12d3-a456-426614174000
 *
 * const invalidPath = '/communications/messages/123e4567-e89b-12d3-a456-426614174000';
 * console.log(checkIfPathStartsWithPattern(invalidPath, pattern));
 * // Output: null
 *
 * const suffixGarbage = '/communications/drafts/123e4567-e89b-12d3-a456-426614174000foo';
 * console.log(checkIfPathStartsWithPattern(suffixGarbage, pattern));
 * // Output: null
 * ```
 *
 * @param path - The URL/path string to check.
 * @param pattern - The pattern string containing `[uuid]` placeholder.
 * @returns The extracted UUID if the path matches the pattern; otherwise, null.
 */
function checkIfPathStartsWithPattern(path: string, pattern: string): string | null {
	// Escape regex special characters in the pattern except for [uuid]
	const regexPattern = pattern
		.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		.replace('\\[uuid\\]', '([0-9a-fA-F-]{36})');

	// UUID must be followed by end of path or a slash (segment boundary)
	const regex = new RegExp(`^${regexPattern}(?:$|/)`);
	const match = path.match(regex);
	return match ? match[1] : null;
}
