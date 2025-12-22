import {
	object,
	optional,
	pipe,
	string,
	maxLength,
	type InferOutput,
	variant,
	literal,
	nullable
} from 'valibot';
import { uuid, mediumStringEmpty } from '$lib/schema/helpers';
export const socialMedia = object({
	facebook: optional(nullable(mediumStringEmpty)),
	twitter: optional(nullable(mediumStringEmpty)),
	instagram: optional(nullable(mediumStringEmpty)),
	linkedIn: optional(nullable(mediumStringEmpty)),
	tiktok: optional(nullable(mediumStringEmpty)),
	website: optional(nullable(mediumStringEmpty))
});
export type SocialMedia = InferOutput<typeof socialMedia>;
export const DEFAULT_SOCIAL_MEDIA: SocialMedia = {
	facebook: null,
	twitter: null,
	instagram: null,
	linkedIn: null,
	tiktok: null,
	website: null
};

export const personAddedFrom = variant('type', [
	object({
		type: literal('seeds')
	}),
	object({
		type: literal('import'),
		importId: uuid
	}),
	object({
		type: literal('added_manually'),
		userId: uuid
	}),
	object({
		type: literal('added_from_event'),
		eventSignupId: uuid
	}),
	object({
		type: literal('added_from_petition'),
		petitionSignatureId: uuid
	})
]);
export type PersonAddedFrom = InferOutput<typeof personAddedFrom>;
