import { db } from '$lib/server/db';
import { _getEventByIdUnsafe } from '$lib/server/api/data/event/event';
import { _getPersonByIdUnsafeNoTenantCheck } from '$lib/server/api/data/person/person';
import { _getEmailMessageByIdUnsafeNoTenantCheck } from '$lib/server/api/data/email/message';
import { _getWhatsappThreadByIdUnsafeNoTenantCheck } from '$lib/server/api/data/whatsapp/thread';
import { _getPetitionByIdUnsafeNoTenantCheck } from '$lib/server/api/data/petition/petition';
export async function inferOrganizationIdFromUrl({ url }: { url: URL }): Promise<string | null> {
	const path = url.pathname;

	//COMMUNICATIONS
	if (checkIfPathStartsWithPattern(path, '/communications/email/drafts/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/communications/email/drafts/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const emailMessage = await _getEmailMessageByIdUnsafeNoTenantCheck({
				emailMessageId: uuid,
				tx
			});
			if (!emailMessage) {
				throw new Error('Email message not found');
			}
			return emailMessage.organizationId;
		});
		return result;
	}
	if (checkIfPathStartsWithPattern(path, '/communications/email/sent/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/communications/email/sent/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const emailMessage = await _getEmailMessageByIdUnsafeNoTenantCheck({
				emailMessageId: uuid,
				tx
			});
			if (!emailMessage) {
				throw new Error('Email message not found');
			}
			return emailMessage.organizationId;
		});
		return result;
	}

	if (checkIfPathStartsWithPattern(path, '/communications/whatsapp/draft/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/communications/whatsapp/draft/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const whatsappThread = await _getWhatsappThreadByIdUnsafeNoTenantCheck({
				whatsappThreadId: uuid,
				tx
			});
			if (!whatsappThread) {
				throw new Error('Whatsapp thread not found');
			}
			return whatsappThread.organizationId;
		});
		return result;
	}
	if (checkIfPathStartsWithPattern(path, '/communications/whatsapp/sent/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/communications/whatsapp/sent/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const whatsappThread = await _getWhatsappThreadByIdUnsafeNoTenantCheck({
				whatsappThreadId: uuid,
				tx
			});
			if (!whatsappThread) {
				throw new Error('Whatsapp thread not found');
			}
			return whatsappThread.organizationId;
		});
		return result;
	}
	//COMMUNITY
	if (checkIfPathStartsWithPattern(path, '/community/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/community/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const person = await _getPersonByIdUnsafeNoTenantCheck({ personId: uuid, tx });
			if (!person) {
				throw new Error('Person not found');
			}
			return person.organizationId;
		});
		return result;
	}
	//EVENTS
	if (checkIfPathStartsWithPattern(path, '/events/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/events/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const event = await _getEventByIdUnsafe({ eventId: uuid, tx });
			if (!event) {
				throw new Error('Event not found');
			}
			return event.organizationId;
		});
		return result;
	}
	//PETITIONS
	if (checkIfPathStartsWithPattern(path, '/petitions/[uuid]')) {
		const uuid = checkIfPathStartsWithPattern(path, '/petitions/[uuid]');
		if (!uuid) {
			return null;
		}
		const result = await db.transaction(async (tx) => {
			const petition = await _getPetitionByIdUnsafeNoTenantCheck({ petitionId: uuid, tx });
			if (!petition) {
				throw new Error('Petition not found');
			}
			return petition.organizationId;
		});
		return result;
	}
	return null;
}

/**
 * Checks if a given path starts with a pattern containing a [uuid] placeholder.
 * If it matches, returns the extracted UUID; otherwise, returns null.
 * Anything after the UUID in the path is allowed.
 *
 * Example usage:
 * ```ts
 * const path1 = '/communications/drafts/123e4567-e89b-12d3-a456-426614174000';
 * const path2 = '/communications/drafts/123e4567-e89b-12d3-a456-426614174000/foobar';
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

	// Match the pattern at the start, allow anything after
	const regex = new RegExp(`^${regexPattern}.*`);
	const match = path.match(regex);
	return match ? match[1] : null;
}
