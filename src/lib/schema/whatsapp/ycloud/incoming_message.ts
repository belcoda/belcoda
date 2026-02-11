import * as v from 'valibot';
import * as messageTypes from '$lib/schema/whatsapp/ycloud/message_types';
import { mediumString, isoTimestamp } from '$lib/schema/helpers';

const baseIncomingMessage = v.object({
	id: mediumString, //63f87878509703399f3fd3d0...
	wabaId: mediumString,
	wamid: mediumString, //wamid.HBgNODr...
	from: mediumString,
	to: mediumString,
	sendTime: isoTimestamp,
	customerProfile: v.optional(
		v.object({
			name: v.optional(mediumString)
		})
	),
	context: v.optional(messageTypes.context)
});

const _textMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.textMessage.entries
});

const _imageMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.imageMessage.entries
});

const _videoMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.videoMessage.entries
});

const _audioMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.audioMessage.entries
});

const _documentMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.documentMessage.entries
});

const _stickerMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.stickerMessage.entries
});

const _locationMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.locationMessage.entries
});

const _reactionMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.reactionMessage.entries
});

const _unsupportedMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.unsupportedMessage.entries
});

const _systemMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.systemMessage.entries
});

const _interactiveButtonReplyMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.interactiveButtonReplyMessage.entries
});

const _templateButtonReplyMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.templateButtonReplyMessage.entries
});

const _interactiveFlowReplyMessage = v.object({
	...baseIncomingMessage.entries,
	...messageTypes.interactiveFlowReplyMessage.entries
});

export const incomingMessageObject = v.variant('type', [
	_textMessage,
	_imageMessage,
	_videoMessage,
	_audioMessage,
	_documentMessage,
	_stickerMessage,
	_locationMessage,
	_reactionMessage,
	_unsupportedMessage,
	_systemMessage,
	_interactiveButtonReplyMessage,
	_templateButtonReplyMessage,
	_interactiveFlowReplyMessage
]);
export type IncomingMessageObject = v.InferOutput<typeof incomingMessageObject>;

export const incomingMessageSchema = v.object({
	id: mediumString,
	type: v.literal('whatsapp.inbound_message.received'),
	apiVersion: v.literal('v2'),
	createTime: isoTimestamp,
	whatsappInboundMessage: incomingMessageObject
});

export type IncomingMessage = v.InferOutput<typeof incomingMessageSchema>;
