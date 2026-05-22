import * as v from 'valibot';

// --- Loose helpers ---
const optStr = v.optional(v.string());
const optNum = v.optional(v.number());

// --- Conversation ---
const conversationSchema = v.optional(
	v.object({
		id: optStr,
		type: v.optional(v.picklist(['FREE_ENTRY', 'FREE_TIER', 'REGULAR'])),
		originType: v.optional(
			v.picklist(['referral_conversion', 'authentication', 'marketing', 'utility', 'service'])
		),
		expireTime: optStr
	})
);

// --- WhatsApp API Error ---
const whatsappApiErrorSchema = v.optional(
	v.object({
		message: v.string(),
		code: v.string(),
		type: optStr,
		error_subcode: optStr,
		error_user_msg: optStr,
		error_user_title: optStr,
		fbtrace_id: optStr,
		error_data: v.optional(v.unknown())
	})
);

// --- 200 Response ---
export const sendWhatsappTemplateResponseSchema = v.object({
	// Core identifiers
	id: v.string(),
	wamid: optStr,
	wabaId: v.string(),

	// Parties
	from: v.string(),
	to: v.string(),

	// Message type + loose content — we don't validate the actual payload deeply
	type: optStr,
	template: v.optional(v.record(v.string(), v.unknown())),
	text: v.optional(v.record(v.string(), v.unknown())),
	image: v.optional(v.record(v.string(), v.unknown())),
	video: v.optional(v.record(v.string(), v.unknown())),
	audio: v.optional(v.record(v.string(), v.unknown())),
	document: v.optional(v.record(v.string(), v.unknown())),
	sticker: v.optional(v.record(v.string(), v.unknown())),
	location: v.optional(v.record(v.string(), v.unknown())),
	interactive: v.optional(v.record(v.string(), v.unknown())),
	contacts: v.optional(v.array(v.record(v.string(), v.unknown()))),
	reaction: v.optional(v.record(v.string(), v.unknown())),
	context: v.optional(v.record(v.string(), v.unknown())),

	// Status & errors
	status: v.optional(v.picklist(['accepted', 'failed', 'sent', 'delivered', 'read'])),
	errorCode: optStr,
	errorMessage: optStr,

	// Timestamps
	createTime: optStr,
	updateTime: optStr,
	sendTime: optStr,
	deliverTime: optStr,
	readTime: optStr,

	// Pricing metadata
	totalPrice: optNum,
	currency: optStr,
	regionCode: optStr,
	pricingCategory: optStr,
	pricingModel: v.optional(v.picklist(['PMP', 'CBP'])),
	pricingType: v.optional(v.picklist(['regular', 'free_customer_service', 'free_entry_point'])),

	// Conversation metadata
	conversation: conversationSchema,

	// Misc
	externalId: optStr,
	bizType: optStr,
	verificationId: optStr,

	// WhatsApp API error passthrough
	whatsappApiError: whatsappApiErrorSchema
});

export type SendWhatsappTemplateResponse = v.InferOutput<typeof sendWhatsappTemplateResponseSchema>;

export function mockSendWhatsappTemplateResponse(externalId: string): SendWhatsappTemplateResponse {
	return {
		id: 'msg_mock_001',
		wamid: 'wamid.mock001',
		wabaId: 'waba_mock_001',
		from: '+10000000000',
		to: '+10000000001',
		type: 'template',
		template: {
			name: 'mock_template',
			language: { code: 'en_US' },
			components: []
		},
		status: 'accepted',
		errorCode: undefined,
		errorMessage: undefined,
		createTime: '2024-01-01T00:00:00.000Z',
		updateTime: '2024-01-01T00:00:00.000Z',
		sendTime: undefined,
		deliverTime: undefined,
		readTime: undefined,
		totalPrice: 0,
		currency: 'USD',
		regionCode: 'US',
		pricingCategory: 'utility',
		pricingModel: 'CBP',
		pricingType: 'regular',
		conversation: {
			id: 'conv_mock_001',
			type: 'REGULAR',
			originType: 'utility',
			expireTime: '2024-01-02T00:00:00.000Z'
		},
		externalId,
		bizType: 'whatsapp',
		verificationId: undefined,
		whatsappApiError: undefined
	};
}
