import { defineQuery } from '@rocicorp/zero';
import { builder, type QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { readNotificationZero } from '$lib/schema/notification';
import { notificationReadPermissions } from '$lib/zero/query/notification/permissions';

export const inputSchema = object({
	notificationId: uuid
});

export function readNotificationQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.notification
		.where('id', '=', input.notificationId)
		.where((expr) => notificationReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readNotification = defineQuery(inputSchema, ({ ctx, args }) => {
	return readNotificationQuery({ ctx, input: args });
});

export const outputSchema = readNotificationZero;
