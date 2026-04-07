import { picklist, type InferOutput } from 'valibot';

export const whatsappTemplateStatus = picklist([
	'NOT_SUBMITTED',
	'PENDING',
	'APPROVED',
	'REJECTED',
	'IN_APPEAL',
	'PENDING_DELETION',
	'DELETED',
	'DISABLED',
	'PAUSED',
	'FLAGGED',
	'REINSTATED',
	'LIMIT_EXCEEDED'
]);
export type WhatsappTemplateStatus = InferOutput<typeof whatsappTemplateStatus>;
