import { json } from '@sveltejs/kit';
import { createPerson } from '$lib/server/api/mutate/person';
import { runMutator } from '$lib/server/db/mutate';
import {
	createMutatorSchemaRest,
	type CreateMutatorSchemaRestInput,
	readPersonRest
} from '$lib/schema/person';
import { getOrganization } from '$lib/server/api/utils/organization';
import { faker } from '@faker-js/faker';
import { parse } from 'valibot';
export const GET = async (event) => {
	try {
		if (!event.locals.session?.user.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const ORGANIZATION_ID = '6fa796c2-1c27-40d5-9d50-119b90ce409f';
		const organization = await getOrganization({
			userId: event.locals.session.user.id,
			organizationId: ORGANIZATION_ID
		});

		const input: CreateMutatorSchemaRestInput = {
			input: {
				dateOfBirth: faker.date.birthdate({ min: 18, max: 32, mode: 'age' }),
				familyName: 'Doe',
				givenName: 'John',
				emailAddress: 'john.doe@example.com',
				phoneNumber: '+61420365887',
				country: organization.country,
				preferredLanguage: organization.defaultLanguage,
				subscribed: true,
				doNotContact: false
			},
			metadata: {
				organizationId: ORGANIZATION_ID,
				personId: faker.string.uuid(),
				addedFrom: {
					type: 'added_manually',
					userId: event.locals.session.user.id
				}
			}
		};
		const { data, status } = await runMutator({
			mutator: createPerson,
			input: input,
			userId: event.locals.session.user.id,
			inputSchema: createMutatorSchemaRest,
			outputSchema: readPersonRest,
			fallback: '404'
		});
		return json(data, { status });
	} catch (error) {
		console.error(error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
