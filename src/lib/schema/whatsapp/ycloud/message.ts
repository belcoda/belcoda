import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

// --- Media Schemas ---
export const imageSchema = v.object({
	link: helpers.url,
	caption: v.optional(helpers.mediumString)
});

export const videoSchema = v.object({
	link: helpers.url,
	caption: v.optional(helpers.mediumString)
});

export const audioSchema = v.object({
	link: helpers.url
});

export const documentSchema = v.object({
	link: helpers.url,
	caption: v.optional(helpers.mediumString),
	filename: v.optional(helpers.mediumString)
});

export const stickerSchema = v.object({
	link: helpers.url
});

// --- Contacts Schema ---
export const contactAddressSchema = v.object({
	street: v.optional(helpers.mediumString),
	city: v.optional(helpers.mediumString),
	state: v.optional(helpers.mediumString),
	zip: v.optional(helpers.postcode),
	country: v.optional(helpers.shortString),
	country_code: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(8))),
	type: v.optional(helpers.shortString)
});
const contactEmailSchema = v.object({
	email: helpers.email,
	type: v.optional(helpers.shortString)
});
const contactNameSchema = v.object({
	formatted_name: helpers.mediumString,
	first_name: v.optional(helpers.mediumString),
	last_name: v.optional(helpers.mediumString),
	middle_name: v.optional(helpers.mediumString),
	suffix: v.optional(helpers.mediumString),
	prefix: v.optional(helpers.mediumString)
});
const contactOrgSchema = v.object({
	company: v.optional(helpers.mediumString),
	department: v.optional(helpers.mediumString),
	title: v.optional(helpers.mediumString)
});
const contactPhoneSchema = v.object({
	phone: helpers.e164PhoneNumber,
	wa_id: v.optional(helpers.mediumString),
	type: v.optional(helpers.shortString)
});
const contactUrlSchema = v.object({
	url: helpers.url,
	type: v.optional(helpers.shortString)
});
const contactSchema = v.object({
	addresses: v.optional(v.array(contactAddressSchema)),
	birthday: v.optional(v.string()),
	emails: v.optional(v.array(contactEmailSchema)),
	name: contactNameSchema,
	org: v.optional(contactOrgSchema),
	phones: v.optional(v.array(contactPhoneSchema)),
	urls: v.optional(v.array(contactUrlSchema))
});

// --- Location Schema ---
const locationSchema = v.object({
	latitude: v.number(),
	longitude: v.number(),
	name: helpers.mediumString,
	address: helpers.mediumString
});

// --- Reaction Schema ---
const reactionSchema = v.object({
	message_id: helpers.mediumString,
	emoji: v.string()
});

// --- Text Schema ---
const textSchema = v.object({
	body: helpers.mediumString,
	preview_url: v.optional(v.boolean())
});

// --- Context Schema ---
const contextSchema = v.object({
	message_id: helpers.mediumString
});

// --- Interactive Schemas ---
const interactiveHeaderSchema = v.union([
	v.object({ type: v.literal('text'), text: helpers.mediumString }),
	v.object({ type: v.literal('image'), image: imageSchema }),
	v.object({ type: v.literal('video'), video: videoSchema }),
	v.object({ type: v.literal('document'), document: documentSchema })
]);
const interactiveFooterSchema = v.object({ text: helpers.mediumString });
const interactiveBodySchema = v.object({ text: helpers.mediumString });

const interactiveActionButtonReplySchema = v.object({
	type: v.literal('reply'),
	reply: v.object({
		id: helpers.mediumString,
		title: helpers.mediumString
	})
});
const interactiveActionButtonsSchema = v.object({
	buttons: v.pipe(v.array(interactiveActionButtonReplySchema), v.minLength(1), v.maxLength(3))
});
const interactiveActionListSchema = v.object({
	button: helpers.mediumString,
	sections: v.pipe(
		v.array(
			v.object({
				title: helpers.mediumString,
				rows: v.pipe(
					v.array(
						v.object({
							id: helpers.mediumString,
							title: helpers.mediumString,
							description: v.optional(v.string())
						})
					),
					v.minLength(1),
					v.maxLength(10)
				)
			})
		),
		v.minLength(1),
		v.maxLength(10)
	)
});
const interactiveActionProductSchema = v.object({
	catalog_id: helpers.mediumString,
	product_retailer_id: helpers.mediumString
});
const interactiveActionProductListSchema = v.object({
	catalog_id: helpers.mediumString,
	sections: v.pipe(
		v.array(
			v.object({
				title: helpers.mediumString,
				product_items: v.pipe(
					v.array(v.object({ product_retailer_id: helpers.mediumString })),
					v.minLength(1),
					v.maxLength(30)
				)
			})
		),
		v.minLength(1),
		v.maxLength(10)
	)
});
const interactiveActionCatalogSchema = v.object({
	name: v.literal('catalog_message'),
	parameters: v.object({ thumbnail_product_retailer_id: helpers.mediumString })
});
const interactiveActionFlowSchema = v.object({
	name: v.literal('flow'),
	parameters: v.object({
		flow_message_version: helpers.mediumString,
		flow_id: v.optional(helpers.mediumString),
		flow_name: v.optional(helpers.mediumString),
		flow_cta: helpers.mediumString,
		flow_action: v.optional(v.string()),
		flow_action_payload: v.optional(
			v.object({
				screen: v.optional(helpers.mediumString),
				data: v.optional(v.record(v.string(), v.any()))
			})
		)
	})
});
const interactiveActionOrderDetailsSchema = v.object({
	name: v.literal('review_and_pay'),
	parameters: v.record(v.string(), v.any()) // For brevity, can be made stricter
});
const interactiveActionOrderStatusSchema = v.object({
	name: v.literal('review_order'),
	parameters: v.record(v.string(), v.any())
});
const interactiveActionVoiceCallSchema = v.object({
	name: v.literal('voice_call'),
	parameters: v.object({ display_text: helpers.mediumString })
});

const interactiveSchema = v.object({
	type: v.union([
		v.literal('button'),
		v.literal('list'),
		v.literal('product'),
		v.literal('product_list'),
		v.literal('catalog_message'),
		v.literal('flow'),
		v.literal('order_details'),
		v.literal('order_status'),
		v.literal('voice_call'),
		v.literal('cta_url'),
		v.literal('location_request_message')
	]),
	header: v.optional(interactiveHeaderSchema),
	body: v.optional(interactiveBodySchema),
	footer: v.optional(interactiveFooterSchema),
	action: v.union([
		interactiveActionButtonsSchema,
		interactiveActionListSchema,
		interactiveActionProductSchema,
		interactiveActionProductListSchema,
		interactiveActionCatalogSchema,
		interactiveActionFlowSchema,
		interactiveActionOrderDetailsSchema,
		interactiveActionOrderStatusSchema,
		interactiveActionVoiceCallSchema,
		v.object({ name: v.string(), parameters: v.record(v.string(), v.any()) }) // fallback for other types
	])
});

// --- Template Schema ---
const templateParameterSchema = v.union([
	v.object({ type: v.literal('text'), text: helpers.mediumString }),
	v.object({
		type: v.literal('currency'),
		currency: v.object({
			fallback_value: helpers.mediumString,
			code: helpers.mediumString,
			amount_1000: v.number()
		})
	}),
	v.object({
		type: v.literal('date_time'),
		date_time: v.object({ fallback_value: helpers.mediumString })
	}),
	v.object({ type: v.literal('image'), image: imageSchema }),
	v.object({ type: v.literal('document'), document: documentSchema }),
	v.object({ type: v.literal('video'), video: videoSchema })
]);
const templateComponentSchema = v.object({
	type: v.union([v.literal('header'), v.literal('body'), v.literal('button')]),
	sub_type: v.optional(v.union([v.literal('quick_reply'), v.literal('url'), v.literal('catalog')])),
	index: v.optional(v.union([v.string(), v.number()])),
	parameters: v.optional(v.array(templateParameterSchema))
});
const templateSchema = v.object({
	name: helpers.mediumString,
	language: v.object({
		code: helpers.mediumString,
		policy: v.optional(v.literal('deterministic'))
	}),
	components: v.optional(v.array(templateComponentSchema))
});

const whatsappMessageSchemaBase = v.object({
	from: helpers.shortString,
	externalId: helpers.uuid,
	to: helpers.e164PhoneNumber,
	context: v.optional(contextSchema)
});

// --- Main Variant Schema ---
export const ycloudWhatsappMessageSchema = v.variant('type', [
	// Text
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('text'),
		text: textSchema
	}),
	// Image
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('image'),
		image: imageSchema
	}),
	// Video
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('video'),
		video: videoSchema
	}),
	// Audio
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('audio'),
		audio: audioSchema
	}),
	// Document
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('document'),
		document: documentSchema
	}),
	// Sticker
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('sticker'),
		sticker: stickerSchema
	}),
	// Contacts
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('contacts'),
		contacts: v.pipe(v.array(contactSchema), v.minLength(1))
	}),
	// Location
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('location'),
		location: locationSchema
	}),
	// Reaction
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('reaction'),
		reaction: reactionSchema
	}),
	// Interactive
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('interactive'),
		interactive: interactiveSchema
	}),
	// Template
	v.object({
		...whatsappMessageSchemaBase.entries,
		type: v.literal('template'),
		template: templateSchema
	})
]);

export type YCloudWhatsappMessage = v.InferOutput<typeof ycloudWhatsappMessageSchema>;
