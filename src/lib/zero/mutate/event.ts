import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import { type CreateMutatorSchemaOutput, type UpdateMutatorSchemaOutput } from '$lib/schema/event';

export function createEvent() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaOutput) {
		tx.mutate.event.insert({
			id: args.metadata.eventId,
			organizationId: args.metadata.organizationId,
			teamId: args.metadata.teamId,
			slug: args.input.slug,
			title: args.input.title,
			shortDescription: args.input.shortDescription,
			description: args.input.description,
			published: false,
			startsAt: args.input.startsAt.getTime(),
			endsAt: args.input.endsAt.getTime(),
			onlineLink: args.input.onlineLink,
			addressLine1: args.input.addressLine1,
			addressLine2: args.input.addressLine2,
			locality: args.input.locality,
			region: args.input.region,
			postcode: args.input.postcode,
			country: args.input.country,
			timezone: args.input.timezone,
			maxSignups: args.input.maxSignups,
			featureImage: args.input.featureImage,
			signupTag: args.input.signupTag,
			attendanceTag: args.input.attendanceTag,
			sendReminderHoursBefore: args.input.sendReminderHoursBefore,
			settings: args.input.settings,
			reminderSentAt: null,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}

export function updateEvent() {
	return async function (tx: Transaction<Schema>, args: UpdateMutatorSchemaOutput) {
		tx.mutate.event.update({
			id: args.metadata.eventId,
			...args.input,
			startsAt: args.input.startsAt ? args.input.startsAt.getTime() : undefined,
			endsAt: args.input.endsAt ? args.input.endsAt.getTime() : undefined,
			updatedAt: new Date().getTime()
		});
	};
}
