import { defineMutators } from '@rocicorp/zero';

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
import * as tag from '$lib/server/api/mutate/tag';
import * as team from '$lib/server/api/mutate/team';
import * as whatsappTemplate from '$lib/server/api/mutate/whatsapp_template';
import * as whatsappThread from '$lib/server/api/mutate/whatsapp_thread';

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
	personNote: {
		create: personNote.createPersonNote,
		update: personNote.updatePersonNote,
		delete: personNote.deletePersonNote
	},
	personImport: {
		insert: personImport.insertPersonImport,
		triggerQueue: personImport.triggerImportQueue
	},
	event: {
		create: event.createEvent,
		update: event.updateEvent,
		delete: event.deleteEvent,
		archive: event.archiveEvent
	},
	eventSignup: {
		create: eventSignup.createEventSignup,
		update: eventSignup.updateEventSignup
	},
	petition: {
		create: petition.createPetition,
		update: petition.updatePetition,
		archive: petition.archivePetition,
		delete: petition.deletePetition
	},
	petitionSignature: {
		create: petitionSignature.createPetitionSignature,
		update: petitionSignature.updatePetitionSignature,
		delete: petitionSignature.deletePetitionSignature
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
	},
	tag: {
		create: tag.createTag,
		update: tag.updateTag,
		delete: tag.deleteTag
	},
	team: {
		create: team.createTeam,
		update: team.updateTeam,
		addUserToTeam: team.addUserToTeam,
		removeUserFromTeam: team.removeUserFromTeam
	},
	whatsappTemplate: {
		create: whatsappTemplate.createWhatsappTemplate,
		update: whatsappTemplate.updateWhatsappTemplate
	},
	whatsappThread: {
		create: whatsappThread.createWhatsappThread,
		update: whatsappThread.updateWhatsappThread,
		delete: whatsappThread.deleteWhatsappThread
	}
});
