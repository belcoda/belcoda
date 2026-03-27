import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';

import {
	createEventZeroMutatorSchema,
	updateEventZeroMutatorSchema,
	deleteEventMutatorSchemaZero,
	archiveEventMutatorSchemaZero
} from '$lib/schema/event';
import { parse } from 'valibot';

export const createEvent = defineMutator(
	createEventZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.event.insert({
			id: args.metadata.eventId,
			organizationId: args.metadata.organizationId,
			teamId: args.input.teamId || undefined,
			slug: args.input.slug,
			title: args.input.title,
			shortDescription: args.input.shortDescription,
			description: args.input.description,
			published: false,
			startsAt: args.input.startsAt,
			endsAt: args.input.endsAt,
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
	}
);

export const updateEvent = defineMutator(
	updateEventZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		const parsed = parse(updateEventZeroMutatorSchema, args);
		tx.mutate.event.update({
			id: args.metadata.eventId,
			...args.input,
			updatedAt: new Date().getTime()
		});
	}
);

export const deleteEvent = defineMutator(
	deleteEventMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.event.update({
			id: args.metadata.eventId,
			deletedAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);

export const archiveEvent = defineMutator(
	archiveEventMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.event.update({
			id: args.metadata.eventId,
			archivedAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);
