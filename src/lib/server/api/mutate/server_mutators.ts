import type { MutatorParams } from '$lib/zero/schema';
import * as person from '$lib/server/api/mutate/person';
import * as personNote from '$lib/server/api/mutate/person_note';
import * as personImport from '$lib/server/api/mutate/person_import';
import * as eventSignup from '$lib/server/api/mutate/event_signup';
import * as event from '$lib/server/api/mutate/event';
import * as petition from '$lib/server/api/mutate/petition';
import * as petitionSignature from '$lib/server/api/mutate/petition_signature';
import * as emailFromSignature from '$lib/server/api/mutate/email_from_signature';
import * as emailMessage from '$lib/server/api/mutate/email_message';
import * as organization from '$lib/server/api/mutate/organization';
import * as webhook from '$lib/server/api/mutate/webhook';

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
		personImport: {
			insert: personImport.insertPersonImport(params),
			triggerQueue: personImport.triggerImportQueue(params)
		},
		personNote: {
			create: personNote.createPersonNote(params),
			update: personNote.updatePersonNote(params),
			delete: personNote.deletePersonNote(params)
		},
		event: {
			create: event.createEvent(params),
			update: event.updateEvent(params)
		},
		eventSignup: {
			create: eventSignup.createEventSignup(params),
			update: eventSignup.updateEventSignup(params)
		},
		petition: {
			create: petition.createPetition(params),
			update: petition.updatePetition(params)
		},
		petitionSignature: {
			create: petitionSignature.createPetitionSignature(params),
			update: petitionSignature.updatePetitionSignature(params)
		},
		emailFromSignature: {
			create: emailFromSignature.createEmailFromSignature(params),
			update: emailFromSignature.updateEmailFromSignature(params),
			delete: emailFromSignature.deleteEmailFromSignature(params),
			verify: emailFromSignature.verifyEmailFromSignature(params),
			setDefault: emailFromSignature.setDefaultSignature(params),
			updateSystemFromIdentity: emailFromSignature.updateSystemFromIdentity(params)
		},
		emailMessage: {
			create: emailMessage.createEmailMessage(params),
			update: emailMessage.updateEmailMessage(params),
			delete: emailMessage.deleteEmailMessage(params),
			send: emailMessage.sendEmailMessage(params)
		},
		organization: {
			update: organization.updateOrganization(params),
			updateWhatsappSettings: organization.updateOrganizationWhatsappSettings(params),
			updateTheme: organization.updateTheme(params)
		},
		webhook: {
			create: webhook.createWebhook(params),
			delete: webhook.deleteWebhook(params)
		}
	};
}
