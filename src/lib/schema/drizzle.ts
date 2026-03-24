import { sql, relations } from 'drizzle-orm';
import {
	pgTable,
	boolean,
	timestamp,
	integer,
	text,
	unique,
	index,
	date,
	jsonb,
	uuid,
	check,
	uniqueIndex,
	primaryKey,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';

import type { OrganizationSchema } from '$lib/schema/organization';
import type { TagSchema } from '$lib/schema/tag';
import type { TeamSchema } from '$lib/schema/team';
import type { UserSchema } from '$lib/schema/user';
import type { InvitationSchema } from '$lib/schema/invitation';
import type { ApiKeySchema } from '$lib/schema/api-key';
import type {
	WebhookSchema,
	WebhookVerificationModes,
	WebhookEventTypes,
	WebhookStatus,
	WebhookPayload,
	WebhookEvents
} from '$lib/schema/webhook';
import type { WebhookLogSchema } from '$lib/schema/webhook-log';
import type { PersonSchema, Gender } from '$lib/schema/person';
import type { PersonImportSchema, PersonImportStatus } from '$lib/schema/person-import';
import type { ActivitySchema } from '$lib/schema/activity';
import type { WhatsappGroupSchema } from '$lib/schema/whatsapp-group';
import type { WhatsappTemplateSchema } from '$lib/schema/whatsapp-template';
import type { WhatsappThreadSchema } from '$lib/schema/whatsapp-thread';
import type { WhatsappMessageSchema, WhatsappMessageStatus } from '$lib/schema/whatsapp-message';
import type { EmailFromSignatureSchema } from '$lib/schema/email-from-signature';
import type { EmailMessageSchema } from '$lib/schema/email-message';
import type { EventSchema } from '$lib/schema/event';
import type { EventSignupSchema } from '$lib/schema/event-signup';
import type { PersonNoteSchema } from '$lib/schema/person-note';
import type { ActionCodeSchema, ActionCodeType } from '$lib/schema/action-code';

import type { SerializedEditorState } from 'lexical';

import { type CountryCode } from '$lib/utils/country';
import { type LanguageCode, type Locale } from '$lib/utils/language';
import { type OrganizationSettingsSchema } from '$lib/schema/organization/settings';
import { type WhatsappTemplateStatus } from '$lib/schema/whatsapp/template/status';
import { type TemplateMessageComponents } from '$lib/schema/whatsapp/template';
import { type FilterGroupType } from '$lib/schema/person/filter';
import {
	type WhatsappMessage,
	type WhatsappTemplateMessage,
	type WhatsappMessageActivityType
} from '$lib/schema/whatsapp/message';
import { type WhatsappMessageActions } from '$lib/schema/whatsapp/actions';
import { type EventSettings } from '$lib/schema/event/settings';
import { type EventSignupDetails, type EventSignupStatus } from '$lib/schema/event/settings';
import { type SocialMedia, type PersonAddedFrom } from '$lib/schema/person/meta';
import { type ActivityType, type ActivityPreviewPayload } from '$lib/schema/activity/types';
import type { PetitionSettingsSchema, PetitionSignatureDetails } from './petition/settings';
import type { Flow as FlowSchema } from '$lib/schema/flow';

type Permissions = {
	[resourceType: string]: ('read' | 'write' | 'delete')[];
};
type IsTrue<T extends true> = T;

export const organization = pgTable('organization', {
	id: uuid('id').primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	logo: text('logo'),
	icon: text('icon'),
	country: text('country').$type<CountryCode>().notNull(),
	defaultLanguage: text('default_language').$type<LanguageCode>().notNull(),
	defaultTimezone: text('default_timezone').notNull(),
	settings: jsonb('settings').$type<OrganizationSettingsSchema>().notNull(),
	balance: integer('balance').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
		.notNull()
		.default(sql`now()`)
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type OrganizationValibotMatchesDrizzle = IsTrue<
	OrganizationSchema extends typeof organization.$inferSelect ? true : false
>;
type OrganizationDrizzleMatchesValibot = IsTrue<
	typeof organization.$inferSelect extends OrganizationSchema ? true : false
>;

export const tag = pgTable(
	'tag',
	{
		id: uuid('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		name: text('name').notNull(),
		active: boolean('active').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [unique('tag_name_unique').on(table.name, table.organizationId)]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type TagValibotMatchesDrizzle = IsTrue<TagSchema extends typeof tag.$inferSelect ? true : false>;
type TagDrizzleMatchesValibot = IsTrue<typeof tag.$inferSelect extends TagSchema ? true : false>;

export const team = pgTable(
	'team',
	{
		id: uuid('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		name: text('name').notNull(),
		parentTeamId: uuid('parent_team_id').references((): AnyPgColumn => team.id),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		unique('team_name_unique').on(table.name, table.organizationId),
		index('team_organization_id').on(table.organizationId)
	]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type TeamValibotMatchesDrizzle = IsTrue<TeamSchema extends typeof team.$inferSelect ? true : false>;
type TeamDrizzleMatchesValibot = IsTrue<typeof team.$inferSelect extends TeamSchema ? true : false>;

export const user = pgTable('user', {
	id: uuid('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
	stripeCustomerId: text('stripe_customer_id'),
	preferredLanguage: text('preferred_language').$type<Locale>(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type UserValibotMatchesDrizzle = IsTrue<UserSchema extends typeof user.$inferSelect ? true : false>;
type UserDrizzleMatchesValibot = IsTrue<typeof user.$inferSelect extends UserSchema ? true : false>;

export const subscription = pgTable('subscription', {
	id: uuid('id').primaryKey(),
	plan: text('plan').notNull(),
	referenceId: uuid('reference_id').notNull(),
	stripeCustomerId: text('stripe_customer_id'),
	stripeSubscriptionId: text('stripe_subscription_id'),
	status: text('status').notNull(),
	periodStart: timestamp('period_start', { withTimezone: true, mode: 'date' }),
	periodEnd: timestamp('period_end', { withTimezone: true, mode: 'date' }),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	seats: integer('seats'),
	trialStart: timestamp('trial_start', { withTimezone: true, mode: 'date' }),
	trialEnd: timestamp('trial_end', { withTimezone: true, mode: 'date' })
});

export const member = pgTable(
	'member',
	{
		id: uuid('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		role: text('role').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [unique('member_user_organization_unique').on(table.userId, table.organizationId)]
);

export const teamMember = pgTable('team_member', {
	id: uuid('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	teamId: uuid('team_id')
		.notNull()
		.references(() => team.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const invitation = pgTable('invitation', {
	id: uuid('id').primaryKey(),
	email: text('email').notNull(),
	inviterId: uuid('inviter_id')
		.references(() => user.id)
		.notNull(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	teamId: uuid('team_id').references(() => team.id),
	role: text('role').notNull(),
	status: text('status').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type InvitationValibotMatchesDrizzle = IsTrue<
	InvitationSchema extends typeof invitation.$inferSelect ? true : false
>;
type InvitationDrizzleMatchesValibot = IsTrue<
	typeof invitation.$inferSelect extends InvitationSchema ? true : false
>;

export const session = pgTable('session', {
	id: uuid('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	token: text('token').notNull().unique(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	activeOrganizationId: uuid('active_organization_id').references(() => organization.id),
	activeTeamId: uuid('active_team_id').references(() => team.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const apiKey = pgTable('api_key', {
	id: uuid('id').primaryKey(),
	name: text('name'),
	start: text('start'),
	prefix: text('prefix'),
	key: text('key').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	refillInterval: integer('refill_interval'),
	refillAmount: integer('refill_amount'),
	lastRefillAt: timestamp('last_refill_at', { withTimezone: true, mode: 'date' }),
	enabled: boolean('enabled').notNull().default(true),
	rateLimitEnabled: boolean('rate_limit_enabled').notNull().default(true),
	rateLimitTimeWindow: integer('rate_limit_time_window'),
	rateLimitMax: integer('rate_limit_max'),
	requestCount: integer('request_count').notNull().default(0),
	remaining: integer('remaining'),
	lastRequest: timestamp('last_request', { withTimezone: true, mode: 'date' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	permissions: text('permissions'),
	metadata: jsonb('metadata')
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type ApiKeyValibotMatchesDrizzle = IsTrue<
	ApiKeySchema extends typeof apiKey.$inferSelect ? true : false
>;
type ApiKeyDrizzleMatchesValibot = IsTrue<
	typeof apiKey.$inferSelect extends ApiKeySchema ? true : false
>;

export const webhook = pgTable(
	'webhook',
	{
		id: uuid('id').notNull().primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		name: text('name').notNull(),
		targetUrl: text('target_url').notNull(),
		secret: text('secret').notNull(),
		verificationMode: text('verification_mode')
			.$type<WebhookVerificationModes>()
			.notNull()
			.default('api_key'),
		enabled: boolean('enabled').notNull().default(true),
		eventTypes: jsonb('event_types').$type<WebhookEventTypes>().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
		lastSuccessAt: timestamp('last_success_at', { withTimezone: true, mode: 'date' }),
		lastFailureAt: timestamp('last_failure_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [unique('webhook_name_unique').on(table.name, table.organizationId)]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type WebhookValibotMatchesDrizzle = IsTrue<
	WebhookSchema extends typeof webhook.$inferSelect ? true : false
>;
type WebhookDrizzleMatchesValibot = IsTrue<
	typeof webhook.$inferSelect extends WebhookSchema ? true : false
>;

export const webhookLog = pgTable(
	'webhook_log',
	{
		id: uuid('id').notNull().primaryKey(),
		webhookId: uuid('webhook_id')
			.notNull()
			.references(() => webhook.id),
		eventType: text('event_type').$type<WebhookEvents>().notNull(),
		status: text('status').$type<WebhookStatus>().notNull(),
		payload: jsonb('payload').$type<WebhookPayload>(),
		httpStatusCode: integer('http_status_code'),
		responseBody: text('response_body'),
		attemptNumber: integer('attempt_number').notNull().default(1), //1-indexed
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [
		index('idx_webhook_logs_endpoint_created_at').on(table.webhookId, table.createdAt.desc())
	]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type WebhookLogValibotMatchesDrizzle = IsTrue<
	WebhookLogSchema extends typeof webhookLog.$inferSelect ? true : false
>;
type WebhookLogDrizzleMatchesValibot = IsTrue<
	typeof webhookLog.$inferSelect extends WebhookLogSchema ? true : false
>;

export const person = pgTable(
	'person',
	{
		id: uuid('id').notNull().primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		familyName: text('family_name'),
		givenName: text('given_name'),

		addressLine1: text('address_line_1'),
		addressLine2: text('address_line_2'),
		locality: text('locality'),
		region: text('region'),
		postcode: text('postcode'),

		country: text('country').$type<CountryCode>().notNull(),
		preferredLanguage: text('preferred_language').$type<LanguageCode>().notNull(),

		workplace: text('workplace'),
		position: text('position'),
		gender: text('gender').$type<Gender>(),
		dateOfBirth: date('date_of_birth', { mode: 'date' }),

		emailAddress: text('email_address'),
		subscribed: boolean('subscribed').notNull(),
		doNotContact: boolean('do_not_contact').notNull(),

		phoneNumber: text('phone_number'),
		whatsAppUsername: text('whatsapp_username'), //if different from phone number

		socialMedia: jsonb('social_media').$type<SocialMedia>().notNull(),

		externalId: text('external_id'),

		mostRecentActivityAt: timestamp('most_recent_activity_at', {
			withTimezone: true,
			mode: 'date'
		}).notNull(),
		mostRecentActivityPreview: jsonb(
			'most_recent_activity_preview'
		).$type<ActivityPreviewPayload>(),

		profilePicture: text('profile_picture'),
		addedFrom: jsonb('added_from').notNull().$type<PersonAddedFrom>(),

		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		uniqueIndex('phone_number_unique')
			.on(table.phoneNumber, table.organizationId)
			.where(sql`${table.deletedAt} is null`),
		uniqueIndex('email_address_unique')
			.on(table.emailAddress, table.organizationId)
			.where(sql`${table.deletedAt} is null`),
		uniqueIndex('whatsapp_username_unique')
			.on(table.whatsAppUsername, table.organizationId)
			.where(sql`${table.deletedAt} is null`),
		check('name_check', sql`${table.familyName} IS NOT NULL OR ${table.givenName} IS NOT NULL`)
	]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type PersonValibotMatchesDrizzle = IsTrue<
	PersonSchema extends typeof person.$inferSelect ? true : false
>;
type PersonDrizzleMatchesValibot = IsTrue<
	typeof person.$inferSelect extends PersonSchema ? true : false
>;

export const personTeam = pgTable(
	'person_team',
	{
		personId: uuid('person_id')
			.notNull()
			.references(() => person.id),
		teamId: uuid('team_id')
			.notNull()
			.references(() => team.id),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [primaryKey({ columns: [table.personId, table.teamId] })]
);

export const personTag = pgTable(
	'person_tag',
	{
		personId: uuid('person_id')
			.notNull()
			.references(() => person.id),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tag.id),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [primaryKey({ columns: [table.personId, table.tagId] })]
);

// people imports table
export const personImport = pgTable('person_import', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	csvUrl: text('csv_url').notNull(),
	status: text('status').$type<PersonImportStatus>().notNull(),
	totalRows: integer('total_rows').notNull().default(0),
	processedRows: integer('processed_rows').notNull().default(0),
	failedRows: integer('failed_rows').notNull().default(0),
	failedEntries: jsonb('failed_entries'),
	importedBy: uuid('imported_by')
		.references(() => user.id)
		.notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' })
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type PersonImportValibotMatchesDrizzle = IsTrue<
	PersonImportSchema extends typeof personImport.$inferSelect ? true : false
>;
type PersonImportDrizzleMatchesValibot = IsTrue<
	typeof personImport.$inferSelect extends PersonImportSchema ? true : false
>;

// activity
export const activity = pgTable(
	'activity',
	{
		id: uuid('id').notNull().primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		personId: uuid('person_id')
			.notNull()
			.references(() => person.id),
		userId: uuid('user_id').references(() => user.id),
		type: text('type').$type<ActivityType>().notNull(),
		referenceId: uuid('reference_id').notNull(),
		unread: boolean('unread').notNull(), //not all activities need to be marked as unread. most of them are read by default.
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [index('activity_person_id').on(table.personId)]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type ActivityValibotMatchesDrizzle = IsTrue<
	ActivitySchema extends typeof activity.$inferSelect ? true : false
>;
type ActivityDrizzleMatchesValibot = IsTrue<
	typeof activity.$inferSelect extends ActivitySchema ? true : false
>;

//whatsapp schema

export const whatsappGroup = pgTable('whatsapp_group', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	name: text('name').notNull(),
	profilePicture: text('profile_picture'),
	teamId: uuid('team_id').references(() => team.id),
	automaticallyAddMembersToTeam: boolean('automatically_add_members_to_team')
		.notNull()
		.default(false),
	automaticallyRemoveMembersFromTeam: boolean('automatically_remove_members_from_team')
		.notNull()
		.default(false),
	inviteCode: text('code').notNull(),
	externalId: text('external_id').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type WhatsappGroupValibotMatchesDrizzle = IsTrue<
	WhatsappGroupSchema extends typeof whatsappGroup.$inferSelect ? true : false
>;
type WhatsappGroupDrizzleMatchesValibot = IsTrue<
	typeof whatsappGroup.$inferSelect extends WhatsappGroupSchema ? true : false
>;

export const whatsappGroupMember = pgTable(
	'whatsapp_group_member',
	{
		id: uuid('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		whatsappGroupId: uuid('whatsapp_group_id')
			.notNull()
			.references(() => whatsappGroup.id),
		personId: uuid('person_id').references(() => person.id),
		whatsappId: text('whatsapp_id'),
		name: text('name'),
		profilePicture: text('profile_picture'),
		addedAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [unique('whatsapp_group_member_unique').on(table.whatsappGroupId, table.personId)]
);

export const whatsappTemplate = pgTable('whatsapp_template', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	teamId: uuid('team_id').references(() => team.id),
	name: text('name').notNull(),
	locale: text('locale').$type<LanguageCode>().notNull(),
	components: jsonb('components').$type<TemplateMessageComponents>().notNull(),
	status: text('status')
		.notNull()
		.$type<WhatsappTemplateStatus>()
		.notNull()
		.default('NOT_SUBMITTED'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	submittedForReviewAt: timestamp('submitted_for_review_at', { withTimezone: true, mode: 'date' }),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type WhatsappTemplateValibotMatchesDrizzle = IsTrue<
	WhatsappTemplateSchema extends typeof whatsappTemplate.$inferSelect ? true : false
>;
type WhatsappTemplateDrizzleMatchesValibot = IsTrue<
	typeof whatsappTemplate.$inferSelect extends WhatsappTemplateSchema ? true : false
>;

// When we send button messages, we will send the id of the button on the template to be {messageId}${buttonId} with a '$' separator.
// That way we can easily identify the message, and find the action to take when the button is clicked.

export const whatsappThread = pgTable('whatsapp_thread', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	teamId: uuid('team_id').references(() => team.id),
	flow: jsonb('flow').$type<FlowSchema>().notNull(),
	sentBy: uuid('sent_by').references(() => user.id),
	title: text('title'), // used for interface purposes
	description: text('description'), // used for interface purposes
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
	estimatedRecipientCount: integer('estimated_recipient_count').notNull(),
	successfulRecipientCount: integer('successful_recipient_count').notNull(),
	failedRecipientCount: integer('failed_recipient_count').notNull(),
	estimatedCost: integer('estimated_cost'), //in hundreds of cents
	totalCost: integer('total_cost'), //in hundreds of cents
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type WhatsappThreadValibotMatchesDrizzle = IsTrue<
	WhatsappThreadSchema extends typeof whatsappThread.$inferSelect ? true : false
>;
type WhatsappThreadDrizzleMatchesValibot = IsTrue<
	typeof whatsappThread.$inferSelect extends WhatsappThreadSchema ? true : false
>;

//individual whatsapp message
export const whatsappMessage = pgTable('whatsapp_message', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	whatsappThreadId: uuid('whatsapp_thread_id').references(() => whatsappThread.id), //onlu matters for analytics and stuff
	externalId: text('external_id'), // WhatsApp message ID. Used for efficient duplicate checking
	wamidId: text('wamid_id'), // wamid id (used for tracking read status, replies, reactions, etc..)
	type: text('type').$type<WhatsappMessageActivityType>().notNull(),
	message: jsonb('message').$type<WhatsappMessage>().notNull(),
	userId: uuid('user_id').references(() => user.id),
	personId: uuid('person_id')
		.notNull()
		.references(() => person.id),
	status: text('status').$type<WhatsappMessageStatus>().notNull(),
	statusMessage: text('status_message'),
	deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'date' }),
	readAt: timestamp('read_at', { withTimezone: true, mode: 'date' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type WhatsappMessageValibotMatchesDrizzle = IsTrue<
	WhatsappMessageSchema extends typeof whatsappMessage.$inferSelect ? true : false
>;
type WhatsappMessageDrizzleMatchesValibot = IsTrue<
	typeof whatsappMessage.$inferSelect extends WhatsappMessageSchema ? true : false
>;

//email schema

export const emailFromSignature = pgTable('email_from_signature', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	teamId: uuid('team_id').references(() => team.id),
	name: text('name').notNull(),
	emailAddress: text('email_address').notNull(),
	externalId: text('external_id'),
	replyTo: text('reply_to'),
	verified: boolean('verified').notNull(),
	returnPathDomain: text('return_path_domain'),
	returnPathDomainVerified: boolean('return_path_domain_verified').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type EmailFromSignatureValibotMatchesDrizzle = IsTrue<
	EmailFromSignatureSchema extends typeof emailFromSignature.$inferSelect ? true : false
>;
type EmailFromSignatureDrizzleMatchesValibot = IsTrue<
	typeof emailFromSignature.$inferSelect extends EmailFromSignatureSchema ? true : false
>;
export const emailMessage = pgTable('email_message', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	teamId: uuid('team_id').references(() => team.id),
	emailFromSignatureId: uuid('email_from_signature_id').references(() => emailFromSignature.id),
	replyToOverride: text('reply_to_override'),

	recipients: jsonb('recipients').$type<FilterGroupType>().notNull(),

	previewTextOverride: text('preview_text_override'),
	previewTextLock: boolean('preview_text_lock').notNull(),
	subject: text('subject'),
	body: jsonb('body'),

	sentBy: uuid('sent_by').references(() => user.id),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
	estimatedRecipientCount: integer('estimated_recipient_count').notNull(),
	successfulRecipientCount: integer('successful_recipient_count').notNull(),
	failedRecipientCount: integer('failed_recipient_count').notNull(),

	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type EmailMessageValibotMatchesDrizzle = IsTrue<
	EmailMessageSchema extends typeof emailMessage.$inferSelect ? true : false
>;
type EmailMessageDrizzleMatchesValibot = IsTrue<
	typeof emailMessage.$inferSelect extends EmailMessageSchema ? true : false
>;

export type EmailSendQueueStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export const emailSendQueue = pgTable(
	'email_send_queue',
	{
		id: uuid('id').primaryKey(),
		personId: uuid('person_id')
			.notNull()
			.references(() => person.id),
		emailMessageId: uuid('email_message_id')
			.notNull()
			.references(() => emailMessage.id),
		status: text('status').notNull(),
		statusMessage: text('status_message'),
		attempts: integer('attempts').notNull(),
		externalId: text('external_id'),
		startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [unique('email_send_queue_unique').on(table.personId, table.emailMessageId)]
);

//events schema
export const event = pgTable(
	'event',
	{
		id: uuid('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		teamId: uuid('team_id').references(() => team.id),

		slug: text('slug').notNull(),
		title: text('title').notNull(),
		shortDescription: text('short_description').notNull(),
		description: jsonb('description').$type<SerializedEditorState>(),

		published: boolean('published').notNull(),

		startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }).notNull(),
		endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }).notNull(),

		onlineLink: text('online_link'),

		addressLine1: text('address_line_1'),
		addressLine2: text('address_line_2'),
		locality: text('locality'),
		region: text('region'),
		postcode: text('postcode'),

		country: text('country').$type<CountryCode>().notNull(),
		timezone: text('timezone').notNull(),

		maxSignups: integer('max_signups'),
		featureImage: text('feature_image'),

		settings: jsonb('settings').$type<EventSettings>().notNull(),

		signupTag: uuid('signup_tag').references(() => tag.id),
		attendanceTag: uuid('attendance_tag').references(() => tag.id),

		sendReminderHoursBefore: integer('send_reminder_hours_before').default(24),
		reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
		archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
		cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [unique('event_slug_unique').on(table.organizationId, table.slug)]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type EventValibotMatchesDrizzle = IsTrue<
	EventSchema extends typeof event.$inferSelect ? true : false
>;
type EventDrizzleMatchesValibot = IsTrue<
	typeof event.$inferSelect extends EventSchema ? true : false
>;

export const eventSignup = pgTable(
	'event_signup',
	{
		id: uuid('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		eventId: uuid('event_id')
			.notNull()
			.references(() => event.id),
		personId: uuid('person_id')
			.notNull()
			.references(() => person.id),
		details: jsonb('details').$type<EventSignupDetails>().notNull(),
		status: text('status').$type<EventSignupStatus>().notNull(),
		signupNotificationSentAt: timestamp('signup_notification_sent_at', {
			withTimezone: true,
			mode: 'date'
		}),
		reminderSentAt: timestamp('reminder_notification_sent_at', {
			withTimezone: true,
			mode: 'date'
		}),
		cancellationNotificationSentAt: timestamp('cancellation_notification_sent_at', {
			withTimezone: true,
			mode: 'date'
		}),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [unique('event_signup_unique').on(table.eventId, table.personId)]
);
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type EventSignupValibotMatchesDrizzle = IsTrue<
	EventSignupSchema extends typeof eventSignup.$inferSelect ? true : false
>;
type EventSignupDrizzleMatchesValibot = IsTrue<
	typeof eventSignup.$inferSelect extends EventSignupSchema ? true : false
>;

export const personNote = pgTable('person_note', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	personId: uuid('person_id')
		.notNull()
		.references(() => person.id),
	note: text('note').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});
// will throw a type error if the drizzle schema definition does not match the base valibot schema
type PersonNoteValibotMatchesDrizzle = IsTrue<
	PersonNoteSchema extends typeof personNote.$inferSelect ? true : false
>;
type PersonNoteDrizzleMatchesValibot = IsTrue<
	typeof personNote.$inferSelect extends PersonNoteSchema ? true : false
>;

// petition schema
export const petition = pgTable('petition', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	teamId: uuid('team_id').references(() => team.id),
	pointPersonId: uuid('point_person_id').references(() => person.id),

	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	description: jsonb('description'),
	shortDescription: text('short_description').notNull(),

	published: boolean('published').notNull(),

	petitionTarget: text('petition_target'),
	petitionText: text('petition_text'),

	featureImage: text('feature_image'),

	settings: jsonb('settings').$type<PetitionSettingsSchema>().notNull(),
	// TODO: Implement these once flows are ready
	// flowQuestions: jsonb('flow_questions').$type<PetitionFlowQuestions>(),

	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
	archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});

export const petitionSignature = pgTable(
	'petition_signature',
	{
		id: uuid('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		teamId: uuid('team_id').references(() => team.id),
		petitionId: uuid('petition_id')
			.notNull()
			.references(() => petition.id),
		personId: uuid('person_id')
			.notNull()
			.references(() => person.id),
		details: jsonb('details').$type<PetitionSignatureDetails>().notNull(),
		// TODO: Define response schema when flows are ready
		responses: jsonb('responses'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.$onUpdate(() => new Date())
	},
	(table) => [unique('petition_signature_unique').on(table.petitionId, table.personId)]
);

export const actionCode = pgTable(
	'action_code',
	{
		id: text('id').primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organization.id),
		referenceId: uuid('reference_id').notNull(),
		type: text('type').$type<ActionCodeType>().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [unique('action_code_unique').on(table.organizationId, table.referenceId, table.type)]
);

// will throw a type error if the drizzle schema definition does not match the base valibot schema
type ActionCodeValibotMatchesDrizzle = IsTrue<
	ActionCodeSchema extends typeof actionCode.$inferSelect ? true : false
>;
type ActionCodeDrizzleMatchesValibot = IsTrue<
	typeof actionCode.$inferSelect extends ActionCodeSchema ? true : false
>;
export const account = pgTable('account', {
	id: uuid('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true, mode: 'date' }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
		withTimezone: true,
		mode: 'date'
	}),
	scope: text('scope'),
	idToken: text('id_token'),
	password: text('password'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const verification = pgTable('verification', {
	id: uuid('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const twoFactor = pgTable('two_factor', {
	id: uuid('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	secret: text('secret'),
	backupCodes: text('backup_codes')
});

// relations for all tables at the end of the file

export const organizationRelations = relations(organization, ({ one, many }) => ({
	memberships: many(member),
	teams: many(team),
	invitations: many(invitation)
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
	organization: one(organization, {
		fields: [subscription.referenceId],
		references: [organization.id]
	})
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	})
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
	organization: one(organization, {
		fields: [tag.organizationId],
		references: [organization.id]
	}),
	personTags: many(personTag)
}));

export const userRelations = relations(user, ({ one, many }) => ({
	orgMemberships: many(member),
	teamMemberships: many(teamMember)
}));

export const teamRelations = relations(team, ({ one, many }) => ({
	organization: one(organization, {
		fields: [team.organizationId],
		references: [organization.id]
	}),
	person: many(personTeam),
	parentTeam: one(team, {
		fields: [team.parentTeamId],
		references: [team.id]
	}),
	user: many(teamMember)
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id]
	})
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	inviter: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [invitation.teamId],
		references: [team.id]
	}),
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	})
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
	user: one(user, {
		fields: [apiKey.userId],
		references: [user.id]
	})
}));

export const webhookRelations = relations(webhook, ({ one, many }) => ({
	organization: one(organization, {
		fields: [webhook.organizationId],
		references: [organization.id]
	})
}));

export const webhookLogRelations = relations(webhookLog, ({ one }) => ({
	webhook: one(webhook, {
		fields: [webhookLog.webhookId],
		references: [webhook.id]
	})
}));

export const personRelations = relations(person, ({ one, many }) => ({
	org: one(organization, {
		fields: [person.organizationId],
		references: [organization.id]
	}),
	teamMemberships: many(personTeam),
	personTags: many(personTag),
	eventSignups: many(eventSignup),
	petitionSignatures: many(petitionSignature),
	whatsappGroupMemberships: many(whatsappGroupMember),
	notes: many(personNote)
}));

export const personTeamRelation = relations(personTeam, ({ one }) => ({
	person: one(person, {
		fields: [personTeam.personId],
		references: [person.id]
	}),
	team: one(team, {
		fields: [personTeam.teamId],
		references: [team.id]
	})
}));

export const personToTagRelations = relations(personTag, ({ one }) => ({
	person: one(person, {
		fields: [personTag.personId],
		references: [person.id]
	}),
	tag: one(tag, {
		fields: [personTag.tagId],
		references: [tag.id]
	})
}));

export const activityRelations = relations(activity, ({ one }) => ({
	organization: one(organization, {
		fields: [activity.organizationId],
		references: [organization.id]
	}),
	person: one(person, {
		fields: [activity.personId],
		references: [person.id]
	}),
	user: one(user, {
		fields: [activity.userId],
		references: [user.id]
	})
}));

export const whatsappGroupRelations = relations(whatsappGroup, ({ one, many }) => ({
	organization: one(organization, {
		fields: [whatsappGroup.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [whatsappGroup.teamId],
		references: [team.id]
	}),
	groupMembers: many(whatsappGroupMember)
}));

export const whatsappGroupMemberRelations = relations(whatsappGroupMember, ({ one }) => ({
	organization: one(organization, {
		fields: [whatsappGroupMember.organizationId],
		references: [organization.id]
	}),
	whatsappGroup: one(whatsappGroup, {
		fields: [whatsappGroupMember.whatsappGroupId],
		references: [whatsappGroup.id]
	}),
	person: one(person, {
		fields: [whatsappGroupMember.personId],
		references: [person.id]
	})
}));

export const whatsappTemplateRelations = relations(whatsappTemplate, ({ one }) => ({
	organization: one(organization, {
		fields: [whatsappTemplate.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [whatsappTemplate.teamId],
		references: [team.id]
	})
}));

export const whatsappThreadRelations = relations(whatsappThread, ({ many, one }) => ({
	organization: one(organization, {
		fields: [whatsappThread.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [whatsappThread.teamId],
		references: [team.id]
	})
}));

export const emailFromSignatureRelations = relations(emailFromSignature, ({ one }) => ({
	organization: one(organization, {
		fields: [emailFromSignature.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [emailFromSignature.teamId],
		references: [team.id]
	})
}));

export const emailMessageRelations = relations(emailMessage, ({ one }) => ({
	organization: one(organization, {
		fields: [emailMessage.organizationId],
		references: [organization.id]
	}),
	emailFromSignature: one(emailFromSignature, {
		fields: [emailMessage.emailFromSignatureId],
		references: [emailFromSignature.id]
	}),
	team: one(team, {
		fields: [emailMessage.teamId],
		references: [team.id]
	})
}));

export const eventRelations = relations(event, ({ one, many }) => ({
	organization: one(organization, {
		fields: [event.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [event.teamId],
		references: [team.id]
	}),
	signups: many(eventSignup)
}));

export const eventSignupRelations = relations(eventSignup, ({ one }) => ({
	organization: one(organization, {
		fields: [eventSignup.organizationId],
		references: [organization.id]
	}),
	event: one(event, {
		fields: [eventSignup.eventId],
		references: [event.id]
	}),
	person: one(person, {
		fields: [eventSignup.personId],
		references: [person.id]
	})
}));

export const petitionRelations = relations(petition, ({ one, many }) => ({
	organization: one(organization, {
		fields: [petition.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [petition.teamId],
		references: [team.id]
	}),
	signatures: many(petitionSignature)
}));

export const petitionSignatureRelations = relations(petitionSignature, ({ one }) => ({
	organization: one(organization, {
		fields: [petitionSignature.organizationId],
		references: [organization.id]
	}),
	petition: one(petition, {
		fields: [petitionSignature.petitionId],
		references: [petition.id]
	}),
	person: one(person, {
		fields: [petitionSignature.personId],
		references: [person.id]
	})
}));

export const personNoteRelations = relations(personNote, ({ one }) => ({
	person: one(person, {
		fields: [personNote.personId],
		references: [person.id]
	}),
	user: one(user, {
		fields: [personNote.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [personNote.organizationId],
		references: [organization.id]
	})
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const personImportRelations = relations(personImport, ({ one }) => ({
	organization: one(organization, {
		fields: [personImport.organizationId],
		references: [organization.id]
	}),
	importedByPerson: one(user, {
		fields: [personImport.importedBy],
		references: [user.id]
	})
}));
