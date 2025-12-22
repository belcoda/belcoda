import type { MutatorParams } from '$lib/zero/schema';
import * as person from '$lib/server/api/mutate/person';
import * as personNote from '$lib/server/api/mutate/person_note';
import * as eventSignup from '$lib/server/api/mutate/event_signup';

export function createMutators(params: MutatorParams) {
	return {
		person: {
			create: person.createPerson(params),
			update: person.updatePerson(params),
			delete: person.deletePerson(params),
			addToTeam: person.addPersonToTeam(params),
			removeFromTeam: person.removePersonFromTeam(params),
			addTag: person.addPersonTag(params),
			removeTag: person.removePersonTag(params)
		},
		personNote: {
			create: personNote.createPersonNote(params),
			update: personNote.updatePersonNote(params),
			delete: personNote.deletePersonNote(params)
		},
		eventSignup: {
			create: eventSignup.createEventSignup(params)
		}
	};
}
