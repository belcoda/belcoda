import * as person from '$lib/zero/mutate/person';
import * as personNote from '$lib/zero/mutate/person_note';
import * as eventSignup from '$lib/zero/mutate/event_signup';
import * as event from '$lib/zero/mutate/event';
export default function createMutators() {
	return {
		person: {
			create: person.createPerson(),
			update: person.updatePerson(),
			delete: person.deletePerson(),
			addToTeam: person.addPersonToTeam(),
			removeFromTeam: person.removePersonFromTeam(),
			addTag: person.addPersonTag(),
			removeTag: person.removePersonTag()
		},
		personNote: {
			create: personNote.createPersonNote(),
			update: personNote.updatePersonNote(),
			delete: personNote.deletePersonNote()
		},
		eventSignup: {
			create: eventSignup.createEventSignup()
		},
		event: {
			create: event.createEvent(),
			update: event.updateEvent()
		}
	};
}
