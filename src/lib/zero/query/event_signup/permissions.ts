import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';

import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the event_signup table
// filtering is based on the event that the event signup is for, as well as the person that the event signup is for
// it should return true if the user has read permissions for the event
// it should return true if the user has read permissions for the person
// it should return false otherwise

export function eventSignupReadPermissions(
	builder: ExpressionBuilder<Schema, 'eventSignup'>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;

	const filterArr = [
		exists('event', (e) => {
			return e.where((eBuilder) => eventReadPermissions(eBuilder, ctx));
		}),
		exists('person', (p) => {
			return p.where((pBuilder) => personReadPermissions(pBuilder, ctx));
		})
	];

	return or(...filterArr);
}
