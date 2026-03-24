import { drizzleZeroConfig } from 'drizzle-zero';
import * as drizzleSchema from '$lib/schema/drizzle';

// Define your configuration file for the CLI
export default drizzleZeroConfig(drizzleSchema, {
	// Specify which tables and columns to include in the Zero schema.
	// This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
	// When a column is first added, it should be set to false, and then changed to true
	// once the migration has been run.

	// All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
	// Column names match your Drizzle schema definitions
	tables: {
		organization: {
			id: true,
			name: true,
			slug: true,
			icon: true,
			logo: true,
			metadata: true,
			country: true,
			defaultLanguage: true,
			defaultTimezone: true,
			balance: true,
			settings: true,
			createdAt: true,
			updatedAt: true
		},
		tag: {
			id: true,
			organizationId: true,
			name: true,
			active: true,
			createdAt: true,
			updatedAt: true
		},
		team: {
			id: true,
			organizationId: true,
			name: true,
			parentTeamId: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true
		},
		user: {
			id: true,
			organizationId: true,
			email: true,
			emailVerified: true,
			image: true,
			name: true,
			preferredLanguage: true,
			twoFactorEnabled: true,
			stripeCustomerId: false,
			createdAt: true,
			updatedAt: true
		},
		subscription: {
			id: true,
			organizationId: true,
			userId: true,
			plan: true,
			referenceId: true,
			stripeCustomerId: true,
			stripeSubscriptionId: true,
			status: true,
			periodStart: true,
			periodEnd: true,
			cancelAtPeriodEnd: true,
			seats: true,
			trialStart: true,
			trialEnd: true,
			createdAt: true,
			updatedAt: true
		},
		member: {
			id: true,
			organizationId: true,
			userId: true,
			role: true,
			createdAt: true,
			updatedAt: true
		},
		teamMember: {
			id: true,
			organizationId: true,
			userId: true,
			teamId: true,
			createdAt: true,
			updatedAt: true
		},
		invitation: {
			id: true,
			organizationId: true,
			email: true,
			inviterId: true,
			teamId: true,
			role: true,
			status: true,
			createdAt: true,
			updatedAt: true
		},
		session: false,
		account: false,
		verification: false,
		twoFactor: false,
		apiKey: {
			id: true,
			name: true,
			start: true,
			prefix: true,
			key: false,
			userId: true,
			refillInterval: true,
			refillAmount: true,
			lastRefillAt: true,
			enabled: true,
			rateLimitEnabled: true,
			rateLimitTimeWindow: true,
			lateLimitMax: true,
			requestCount: true,
			remaining: true,
			lastRequest: true,
			expiresAt: true,
			permissions: true,
			metadata: true,
			createdAt: true,
			updatedAt: true
		},
		person: {
			id: true,
			organizationId: true,
			familyName: true,
			givenName: true,
			status: true,
			teamId: true,
			addressLine1: true,
			addressLine2: true,
			locality: true,
			region: true,
			postcode: true,
			country: true,
			preferredLanguage: true,
			workplace: true,
			position: true,
			gender: true,
			dateOfBirth: true,

			emailAddress: true,
			subscribed: true,
			doNotContact: true,

			phoneNumber: true,

			whatsAppUsername: true,

			socialMedia: true,

			externalId: true,
			mostRecentActivityAt: true,

			profilePicture: true,
			mostRecentActivityPreview: true,
			addedFrom: true,

			createdAt: true,
			updatedAt: true,
			deletedAt: true
		},
		personTag: {
			organizationId: true,
			personId: true,
			tagId: true,
			createdAt: true
		},
		personTeam: {
			personId: true,
			teamId: true,
			organizationId: true,
			createdAt: true
		},
		personImport: {
			id: true,
			organizationId: true,
			csvUrl: true,
			status: true,
			totalRows: true,
			processedRows: true,
			failedRows: true,
			failedEntries: true,
			importedBy: true,
			createdAt: true,
			completedAt: true
		},
		activity: {
			id: true,
			organizationId: true,
			personId: true,
			userId: true,
			type: true,
			payload: true,
			unread: true,
			createdAt: true
		},

		whatsappGroup: {
			id: true,
			organizationId: true,
			name: true,
			profilePicture: true,
			teamId: true,
			inviteCode: true,
			externalId: true,
			createdAt: true,
			updatedAt: true
		},
		whatsappGroupMember: {
			id: true,
			organizationId: true,
			whatsappGroupId: true,
			personId: true,
			isAdmin: true,
			whatsappId: true,
			name: true,
			profilePic: true,
			addedAt: true
		},
		whatsappTemplate: {
			id: true,
			organizationId: true,
			name: true,
			locale: true,
			teamId: true,
			components: true,
			isSystem: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true,
			submittedForReviewAt: true
		},
		whatsappThread: {
			id: true,
			organizationId: true,
			teamId: true,
			flow: true,
			sentBy: true,
			title: true,
			description: true,
			startedAt: true,
			completedAt: true,
			estimatedRecipientCount: true,
			successfulRecipientCount: true,
			failedRecipientCount: true,
			estimatedCost: true,
			totalCost: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true
		},
		whatsappMessage: {
			id: true,
			organizationId: true,
			whatsappThreadId: true,
			externalId: true,
			wamidId: true,
			type: true,
			message: true,
			userId: true,
			personId: true,
			createdAt: true,
			updatedAt: true
		},
		whatsappSendQueue: false,
		emailFromSignature: {
			id: true,
			organizationId: true,
			teamId: true,
			name: true,
			emailAddress: true,
			replyTo: true,
			externalId: true,
			verified: true,
			returnPathDomain: true,
			returnPathDomainVerified: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true
		},
		emailMessage: {
			id: true,
			organizationId: true,
			teamId: true,
			emailFromSignatureId: true,
			replyToOverride: true,
			recipients: true,
			previewTextOverride: true,
			previewTextLock: true,
			subject: true,
			body: true,
			attachments: true,
			sentBy: true,
			startedAt: true,
			completedAt: true,
			estimatedRecipientCount: true,
			successfulRecipientCount: true,
			failedRecipientCount: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true
		},
		emailSendQueue: false,

		event: {
			id: true,
			organizationId: true,
			teamId: true,

			slug: true,
			title: true,
			description: true,
			shortDescription: true,

			startsAt: true,
			endsAt: true,

			onlineLink: true,

			maxSignups: true,
			featureImage: true,
			published: true,

			addressLine1: true,
			addressLine2: true,
			locality: true,
			region: true,
			postcode: true,
			country: true,
			timezone: true,

			settings: true,

			signupTag: true,
			attendanceTag: true,
			sendReminderHoursBefore: true,
			reminderSentAt: true,

			createdAt: true,
			updatedAt: true,
			deletedAt: true,
			archivedAt: true,
			cancelledAt: true
		},
		eventSignup: {
			id: true,
			organizationId: true,
			eventId: true,
			personId: true,
			status: true,
			reminderSentAt: true,
			signupNotificationSentAt: true,
			cancellationNotificationSentAt: true,
			details: true,
			createdAt: true,
			updatedAt: true
		},
		petition: {
			id: true,
			organizationId: true,
			teamId: true,
			pointPersonId: true,

			slug: true,
			title: true,
			description: true,
			shortDescription: true,

			published: true,

			petitionTarget: true,
			petitionText: true,

			featureImage: true,
			settings: true,

			createdAt: true,
			updatedAt: true,
			deletedAt: true,
			archivedAt: true
		},
		petitionSignature: {
			id: true,
			organizationId: true,
			teamId: true,
			petitionId: true,
			personId: true,
			details: true,
			responses: true,
			createdAt: true,
			updatedAt: true
		},
		personNote: {
			id: true,
			organizationId: true,
			personId: true,
			note: true,
			userId: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true
		},
		webhook: {
			id: true,
			organizationId: true,
			name: true,
			targetUrl: true,
			secret: false,
			verificationMode: true,
			enabled: true,
			eventTypes: true,
			createdAt: true,
			updatedAt: true,
			lastSuccessAt: true,
			lastFailureAt: true
		},
		webhookLog: {
			id: true,
			webhookId: true,
			eventType: true,
			status: true,
			payload: true,
			httpStatusCode: true,
			responseBody: true,
			attemptNumber: true,
			createdAt: true
		},
		actionCode: {
			id: true,
			organizationId: true,
			referenceId: true,
			type: true,
			createdAt: true,
			deletedAt: true
		}
	},
	manyToMany: {
		tag: {
			people: ['personTag', 'tag']
		},
		person: {
			tags: ['personTag', 'tag'],
			whatsappGroups: ['whatsappGroupMember', 'whatsappGroup'],
			teams: ['personTeam', 'team'],
			events: ['eventSignup', 'event'],
			petitions: ['petitionSignature', 'petition']
		},
		whatsappGroup: {
			members: ['whatsappGroupMember', 'person']
		},
		team: {
			people: ['personTeam', 'person']
		},
		petition: {
			signers: ['petitionSignature', 'person']
		}
	},
	debug: true

	// Specify the casing style to use for the schema.
	// This is useful for when you want to use a different casing style than the default.
	// This works in the same way as the `casing` option in the Drizzle ORM.
	//
	// @example
	// casing: "snake_case",
});
