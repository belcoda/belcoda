import { randomUUID } from 'node:crypto';

export const UPLOAD_PURPOSES = ['imageupload', 'people-imports'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const UPLOAD_SIGNED_URL_EXPIRES_SECONDS = 300;

const ALLOWED_EXTENSIONS: Record<UploadPurpose, readonly string[]> = {
	imageupload: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
	'people-imports': ['csv']
};

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

function normalizeExtension(extension: string): string {
	const safeExtension = sanitizeExtension(extension);
	return safeExtension === 'jpeg' ? 'jpg' : safeExtension;
}

export function isExtensionAllowedForPurpose(purpose: UploadPurpose, extension: string): boolean {
	const safeExtension = sanitizeExtension(extension);
	return ALLOWED_EXTENSIONS[purpose].includes(safeExtension);
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
	if (!isExtensionAllowedForPurpose(purpose, extension)) {
		throw new Error('Extension is not allowed for this upload purpose');
	}

	const safeExtension = normalizeExtension(extension);
	return `organization/${organizationId}/${purpose}/${randomUUID()}.${safeExtension}`;
}
