import { v7 as uuidv7 } from 'uuid';

/**
 * Maximum size (in bytes) for an uploaded image. This is enforced server-side
 * as the signed-upload policy's `maxSize` — the actual security boundary — and
 * is also checked client-side for immediate feedback. Never trust a
 * client-supplied limit in its place.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export function getUploadPath(organizationId: string, fileName: string) {
	const dateString = new Date().toLocaleDateString('ja-JP', {
		//japanese dates best for this because they are yyyy/mm/dd so split naturally
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	return `uploads/${organizationId}/${dateString}/${uuidv7()}-${fileName}`;
}

export function getOrgIdFromPath(path: string) {
	return path.split('/')[1];
}
