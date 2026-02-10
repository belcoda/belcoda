import * as person from '$lib/zero/mutate/person';
import * as personNote from '$lib/zero/mutate/person_note';
import * as personImport from '$lib/zero/mutate/person_import';
import * as eventSignup from '$lib/zero/mutate/event_signup';
import * as event from '$lib/zero/mutate/event';
import * as petition from '$lib/zero/mutate/petition';
import * as petitionSignature from '$lib/zero/mutate/petition_signature';
import * as emailFromSignature from '$lib/zero/mutate/email_from_signature';
import * as emailMessage from '$lib/zero/mutate/email_message';
import * as organization from '$lib/zero/mutate/organization';
import * as webhook from '$lib/zero/mutate/webhook';

import { defineMutators } from '@rocicorp/zero';

export const mutators = defineMutators({
	person: {
		create: person.createPerson,
		update: person.updatePerson,
		delete: person.deletePerson,
		addToTeam: person.addPersonToTeam,
		removeFromTeam: person.removePersonFromTeam,
		addTag: person.addPersonTag,
		removeTag: person.removePersonTag
	},
	personImport: {
		insert: personImport.insertPersonImport,
		triggerQueue: personImport.triggerImportQueue
	},
	personNote: {
		create: personNote.createPersonNote,
		update: personNote.updatePersonNote,
		delete: personNote.deletePersonNote
	},
	eventSignup: {
		create: eventSignup.createEventSignup,
		update: eventSignup.updateEventSignup
	},
	event: {
		create: event.createEvent,
		update: event.updateEvent
	},
	petition: {
		create: petition.createPetition,
		update: petition.updatePetition
	},
	petitionSignature: {
		create: petitionSignature.createPetitionSignature,
		update: petitionSignature.updatePetitionSignature
	},
	emailFromSignature: {
		create: emailFromSignature.createEmailFromSignature,
		update: emailFromSignature.updateEmailFromSignature,
		delete: emailFromSignature.deleteEmailFromSignature,
		verify: emailFromSignature.verifyEmailFromSignature,
		setDefault: emailFromSignature.setDefaultSignature,
		updateSystemFromIdentity: emailFromSignature.updateSystemFromIdentity
	},
	emailMessage: {
		create: emailMessage.createEmailMessage,
		update: emailMessage.updateEmailMessage,
		delete: emailMessage.deleteEmailMessage,
		send: emailMessage.sendEmailMessage
	},
	organization: {
		update: organization.updateOrganization,
		updateWhatsappSettings: organization.updateOrganizationWhatsappSettings,
		updateTheme: organization.updateTheme
	},
	webhook: {
		create: webhook.createWebhook,
		delete: webhook.deleteWebhook
	}
});
