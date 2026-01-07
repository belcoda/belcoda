import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateEventZeroMutatorSchema,
	type UpdateEventZeroMutatorSchema,
	createEventZeroMutatorSchema,
	updateEventZeroMutatorSchema
} from '$lib/schema/event';
import { parse } from 'valibot';

export function createEvent() {
	return async function (tx: Transaction<Schema>, args: CreateEventZeroMutatorSchema) {
		const parsedArgs = parse(createEventZeroMutatorSchema, args);
		tx.mutate.event.insert({
			id: parsedArgs.metadata.eventId,
			organizationId: parsedArgs.metadata.organizationId,
			teamId: parsedArgs.metadata.teamId,
			slug: parsedArgs.input.slug,
			title: parsedArgs.input.title,
			shortDescription: parsedArgs.input.shortDescription,
			description: parsedArgs.input.description,
			published: false,
			startsAt: parsedArgs.input.startsAt.getTime(),
			endsAt: parsedArgs.input.endsAt.getTime(),
			onlineLink: parsedArgs.input.onlineLink,
			addressLine1: parsedArgs.input.addressLine1,
			addressLine2: parsedArgs.input.addressLine2,
			locality: parsedArgs.input.locality,
			region: parsedArgs.input.region,
			postcode: parsedArgs.input.postcode,
			country: parsedArgs.input.country,
			timezone: parsedArgs.input.timezone,
			maxSignups: parsedArgs.input.maxSignups,
			featureImage: parsedArgs.input.featureImage,
			signupTag: parsedArgs.input.signupTag,
			attendanceTag: parsedArgs.input.attendanceTag,
			sendReminderHoursBefore: parsedArgs.input.sendReminderHoursBefore,
			settings: parsedArgs.input.settings,
			reminderSentAt: null,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}

export function updateEvent() {
	return async function (tx: Transaction<Schema>, args: UpdateEventZeroMutatorSchema) {
		const parsed = parse(updateEventZeroMutatorSchema, args);
		tx.mutate.event.update({
			id: parsed.metadata.eventId,
			...parsed.input,
			startsAt: parsed.input.startsAt ? parsed.input.startsAt.getTime() : undefined,
			endsAt: parsed.input.endsAt ? parsed.input.endsAt.getTime() : undefined,
			updatedAt: new Date().getTime()
		});
	};
}
