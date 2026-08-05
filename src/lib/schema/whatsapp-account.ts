import * as v from 'valibot';
import * as h from './helpers';

export const whatsappAccountScopes = ['user', 'organization'] as const;
export const whatsappAccountScopeSchema = v.picklist(whatsappAccountScopes);
export type WhatsappAccountScope = v.InferOutput<typeof whatsappAccountScopeSchema>;

export const whatsappAccountDetailsSchema = v.any();
export type WhatsappAccountDetails = v.InferOutput<typeof whatsappAccountDetailsSchema>;

export const whatsappAccountMetadataSchema = v.object({
	displayName: v.optional(h.shortString),
	isBusiness: v.boolean(),
	profilePic: v.optional(h.url),
	status: v.optional(h.mediumString)
});
export type WhatsappAccountMetadata = v.InferOutput<typeof whatsappAccountMetadataSchema>;

export const whatsappAccountSchema = v.object({
	id: h.uuid,
	referenceId: h.uuid,
	identifier: h.shortString, //phone number or whatsapp username
	scope: whatsappAccountScopeSchema,
	details: whatsappAccountDetailsSchema,
	metadata: whatsappAccountMetadataSchema,
	createdAt: h.date,
	updatedAt: h.date,
	deletedAt: v.nullable(h.date)
});
export type WhatsappAccount = v.InferOutput<typeof whatsappAccountSchema>;

// Zero read output schema. Zero serialises timestamps as unix millisecond numbers,
// so dates are surfaced as timestamps rather than JS Date objects.
export const readWhatsappAccountZero = v.object({
	id: whatsappAccountSchema.entries.id,
	referenceId: whatsappAccountSchema.entries.referenceId,
	identifier: whatsappAccountSchema.entries.identifier,
	scope: whatsappAccountSchema.entries.scope,
	details: whatsappAccountSchema.entries.details,
	metadata: whatsappAccountSchema.entries.metadata,
	createdAt: h.unixTimestamp,
	updatedAt: h.unixTimestamp,
	deletedAt: v.nullable(h.unixTimestamp)
});
export type ReadWhatsappAccountZero = v.InferOutput<typeof readWhatsappAccountZero>;

// ----------------------------------------------------------------------------
// Mutator schemas
// ----------------------------------------------------------------------------

// The id of the account being mutated is carried in the metadata so that the
// server can look the record up and enforce scope-aware permissions.
export const whatsappAccountMutatorMetadata = v.object({
	whatsappAccountId: h.uuid
});
export type WhatsappAccountMutatorMetadata = v.InferOutput<typeof whatsappAccountMutatorMetadata>;

// --- create ---
// `scope` + `referenceId` fully determine who is allowed to create the account:
//   - organization scope: referenceId is the organization id (admins/owners only)
//   - user scope: referenceId is the owning user's id (that user only)
export const createWhatsappAccountInput = v.object({
	scope: whatsappAccountScopeSchema,
	referenceId: h.uuid,
	identifier: whatsappAccountSchema.entries.identifier,
	details: whatsappAccountDetailsSchema,
	metadata: whatsappAccountMetadataSchema
});
export type CreateWhatsappAccountInput = v.InferOutput<typeof createWhatsappAccountInput>;

export const createWhatsappAccountMutatorSchema = v.object({
	input: createWhatsappAccountInput,
	metadata: whatsappAccountMutatorMetadata
});
export type CreateWhatsappAccountMutatorSchemaInput = v.InferInput<
	typeof createWhatsappAccountMutatorSchema
>;
export type CreateWhatsappAccountMutatorSchemaOutput = v.InferOutput<
	typeof createWhatsappAccountMutatorSchema
>;

// --- delete ---
export const deleteWhatsappAccountMutatorSchema = v.object({
	metadata: whatsappAccountMutatorMetadata
});
export type DeleteWhatsappAccountMutatorSchema = v.InferOutput<
	typeof deleteWhatsappAccountMutatorSchema
>;

// --- unlink ---
// Unlinking soft-deletes the account (stamps `deletedAt`). It differs from a plain
// delete in intent: eventually it should also detach the account at the WhatsApp
// provider via their API (see the `// todo: unlink with API` markers in the mutators).
export const unlinkWhatsappAccountMutatorSchema = v.object({
	metadata: whatsappAccountMutatorMetadata
});
export type UnlinkWhatsappAccountMutatorSchema = v.InferOutput<
	typeof unlinkWhatsappAccountMutatorSchema
>;

// --- update metadata ---
export const updateWhatsappAccountMetadataInput = v.object({
	metadata: whatsappAccountMetadataSchema
});
export type UpdateWhatsappAccountMetadataInput = v.InferOutput<
	typeof updateWhatsappAccountMetadataInput
>;

export const updateWhatsappAccountMetadataMutatorSchema = v.object({
	input: updateWhatsappAccountMetadataInput,
	metadata: whatsappAccountMutatorMetadata
});
export type UpdateWhatsappAccountMetadataMutatorSchemaInput = v.InferInput<
	typeof updateWhatsappAccountMetadataMutatorSchema
>;
export type UpdateWhatsappAccountMetadataMutatorSchemaOutput = v.InferOutput<
	typeof updateWhatsappAccountMetadataMutatorSchema
>;

// ----------------------------------------------------------------------------
// Link account (unofficial WhatsApp Linked Devices API)
// ----------------------------------------------------------------------------

// The signup / linking code (OTP) the user enters to link an existing account.
export const LINK_ACCOUNT_CODE_LENGTH = 6;
export const linkWhatsappAccountCodeSchema = v.pipe(
	v.string(),
	v.trim(),
	v.length(LINK_ACCOUNT_CODE_LENGTH, `The code must be ${LINK_ACCOUNT_CODE_LENGTH} characters`)
);

// Request body sent to POST /api/utils/whatsapp/link_account.
export const linkWhatsappAccountRequestSchema = v.object({
	code: linkWhatsappAccountCodeSchema,
	scope: whatsappAccountScopeSchema
});
export type LinkWhatsappAccountRequest = v.InferOutput<typeof linkWhatsappAccountRequestSchema>;

// Shape returned by the link endpoint on success: the details of the freshly
// linked WhatsApp account, which the client uses to create the local record.
export const linkWhatsappAccountResultSchema = v.object({
	identifier: whatsappAccountSchema.entries.identifier,
	details: whatsappAccountDetailsSchema,
	metadata: whatsappAccountMetadataSchema
});
export type LinkWhatsappAccountResult = v.InferOutput<typeof linkWhatsappAccountResultSchema>;
