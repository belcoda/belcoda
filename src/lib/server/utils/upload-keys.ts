import { v4 as uuidv4 } from 'uuid';

export const UPLOAD_PURPOSES = ['imageupload', 'people-imports'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export function isUploadPurpose(value: string): value is UploadPurpose {
	return (UPLOAD_PURPOSES as readonly string[]).includes(value);
}

export function sanitizeExtension(extension: string): string {
	const normalized = extension.toLowerCase().replace(/^\./, '').trim();
	const sanitized = normalized.replace(/[^a-z0-9]/g, '');
	if (!sanitized || sanitized.length > 10) {
		throw new Error('Invalid file extension');
	}
	return sanitized;
}

export function buildUploadKey({
	organizationId,
	purpose,
	extension
}: {
	organizationId: string;
	purpose: UploadPurpose;
	extension: string;
}): string {
	const safeExtension = sanitizeExtension(extension);
	return `organization/${organizationId}/${purpose}/${uuidv4()}.${safeExtension}`;
}
