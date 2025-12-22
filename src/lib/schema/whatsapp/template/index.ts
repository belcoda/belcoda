import {
	type InferOutput,
	object,
	literal,
	array,
	variant,
	string,
	minLength,
	maxLength,
	pipe
} from 'valibot';
import {
	languageCode,
	url,
	mediumString,
	whatsappTemplateHeaderText,
	whatsappTemplateParamName,
	whatsappTemplateButtonText,
	whatsappTemplateBodyText
} from '$lib/schema/helpers';

export const templateMessageHeader = {
	text: object({
		type: literal('HEADER'),
		format: literal('TEXT'),
		text: whatsappTemplateHeaderText,
		example: object({
			header_text: array(pipe(string(), minLength(1), maxLength(60)))
		})
	}),
	image: object({
		type: literal('HEADER'),
		format: literal('IMAGE'),
		example: object({
			header_url: array(url)
		})
	})
};
export type TemplateMessageHeaderText = InferOutput<typeof templateMessageHeader.text>;
export type TemplateMessageHeaderImage = InferOutput<typeof templateMessageHeader.image>;

export const templateMessageBody = object({
	type: literal('BODY'),
	text: whatsappTemplateBodyText,
	example: object({
		body_text: array(array(pipe(string(), minLength(1), maxLength(1024))))
	})
});
export type TemplateMessageBody = InferOutput<typeof templateMessageBody>;

export const templateMessageButtons = object({
	type: literal('BUTTONS'),
	buttons: array(
		object({
			type: literal('QUICK_REPLY'),
			text: whatsappTemplateButtonText
		})
	)
});

export const templateMessagHeader = variant('format', [
	templateMessageHeader.text,
	templateMessageHeader.image
]);

export const templateMessageComponent = variant('type', [
	templateMessagHeader,
	templateMessageBody,
	templateMessageButtons
]);
export type TemplateMessageComponent = InferOutput<typeof templateMessageComponent>;

export const templateMessageComponents = pipe(
	array(templateMessageComponent),
	minLength(1),
	maxLength(3)
);
export type TemplateMessageComponents = InferOutput<typeof templateMessageComponents>;

export const templateMessage = object({
	name: whatsappTemplateParamName,
	language: languageCode,
	category: literal('MARKETING'),
	parameter_format: literal('NAMED'),
	components: templateMessageComponents
});
