import { defineQueries } from '@rocicorp/zero';

// activity
import { listActivity } from '$lib/zero/query/activity/list';

// action_code
import { listActionCodes } from '$lib/zero/query/action_code/list';

// email_from_signature
import { listEmailFromSignatures } from '$lib/zero/query/email_from_signature/list';
import { readEmailFromSignature } from '$lib/zero/query/email_from_signature/read';

// email_message
import { listEmailMessages } from '$lib/zero/query/email_message/list';
import { readEmailMessage } from '$lib/zero/query/email_message/read';

// event
import { listEvents } from '$lib/zero/query/event/list';
import { readEvent } from '$lib/zero/query/event/read';

// event_signup
import { listEventSignups } from '$lib/zero/query/event_signup/list';
import { readEventSignup } from '$lib/zero/query/event_signup/read';

// organizations
import { listOrganizations } from '$lib/zero/query/organizations/list';
import { readOrganization } from '$lib/zero/query/organizations/read';

// person
import { listPersons, listPersonByIdsArray } from '$lib/zero/query/person/list';
import { readPerson } from '$lib/zero/query/person/read';

// person_import
import { listPersonImports } from '$lib/zero/query/person_import/list';

// person_note
import { listPersonNotes } from '$lib/zero/query/person_note/list';

// petition
import { listPetitions } from '$lib/zero/query/petition/list';
import { readPetition } from '$lib/zero/query/petition/read';

// petition_signature
import {
	listPetitionSignatures,
	listPetitionSignaturesByPetition
} from '$lib/zero/query/petition_signature/list';
import { readPetitionSignature } from '$lib/zero/query/petition_signature/read';

// tag
import { listTags } from '$lib/zero/query/tag/list';
import { readTag } from '$lib/zero/query/tag/read';

// team
import { listTeams } from '$lib/zero/query/team/list';
import { readTeam } from '$lib/zero/query/team/read';
import { listMyTeams } from '$lib/zero/query/team/listMyTeams';

// user
import { listUsers } from '$lib/zero/query/user/list';
import { readUser } from '$lib/zero/query/user/read';

// webhook
import { listWebhooks } from '$lib/zero/query/webhook/list';
import { readWebhook } from '$lib/zero/query/webhook/read';

// webhook_log
import { listWebhookLogs } from '$lib/zero/query/webhook_log/list';

//whatsapp
import { readWhatsappTemplate } from '$lib/zero/query/whatsapp_template/read';
import { listWhatsappTemplates } from '$lib/zero/query/whatsapp_template/list';
import { readWhatsappThread } from '$lib/zero/query/whatsapp_thread/read';
import { listWhatsappThreads } from '$lib/zero/query/whatsapp_thread/list';
import { readWhatsappMessage } from '$lib/zero/query/whatsapp_message/read';
// Re-export all queries
export {
	// activity
	listActivity,
	// action_code
	listActionCodes,
	// email_from_signature
	listEmailFromSignatures,
	readEmailFromSignature,
	// email_message
	listEmailMessages,
	readEmailMessage,
	// event
	listEvents,
	readEvent,
	// event_signup
	listEventSignups,
	readEventSignup,
	// organizations
	listOrganizations,
	readOrganization,
	// person
	listPersons,
	listPersonByIdsArray,
	readPerson,
	// person_import
	listPersonImports,
	// person_note
	listPersonNotes,
	// petition
	listPetitions,
	readPetition,
	// petition_signature
	listPetitionSignatures,
	readPetitionSignature,
	// tag
	listTags,
	readTag,
	// team
	listTeams,
	readTeam,
	listMyTeams,
	// user
	listUsers,
	readUser,
	// webhook
	listWebhooks,
	readWebhook,
	// webhook_log
	listWebhookLogs,
	// whatsapp template
	readWhatsappTemplate,
	listWhatsappTemplates,
	// whatsapp thread
	readWhatsappThread,
	listWhatsappThreads,
	// whatsapp message
	readWhatsappMessage
};

export default defineQueries({
	whatsappMessage: {
		read: readWhatsappMessage
	},
	whatsappTemplate: {
		read: readWhatsappTemplate,
		list: listWhatsappTemplates
	},
	whatsappThread: {
		read: readWhatsappThread,
		list: listWhatsappThreads
	},
	activity: {
		list: listActivity
	},
	actionCode: {
		list: listActionCodes
	},
	emailFromSignature: {
		list: listEmailFromSignatures,
		read: readEmailFromSignature
	},
	emailMessage: {
		list: listEmailMessages,
		read: readEmailMessage
	},
	event: {
		list: listEvents,
		read: readEvent
	},
	eventSignup: {
		list: listEventSignups,
		read: readEventSignup
	},
	organization: {
		list: listOrganizations,
		read: readOrganization
	},
	person: {
		list: listPersons,
		listByIds: listPersonByIdsArray,
		read: readPerson
	},
	personImport: {
		list: listPersonImports
	},
	personNote: {
		list: listPersonNotes
	},
	petition: {
		list: listPetitions,
		read: readPetition,
		signatures: listPetitionSignaturesByPetition
	},
	petitionSignature: {
		list: listPetitionSignatures,
		read: readPetitionSignature
	},
	tag: {
		list: listTags,
		read: readTag
	},
	team: {
		list: listTeams,
		read: readTeam,
		listMyTeams: listMyTeams
	},
	user: {
		list: listUsers,
		read: readUser
	},
	webhook: {
		list: listWebhooks,
		read: readWebhook
	},
	webhookLog: {
		list: listWebhookLogs
	}
});
