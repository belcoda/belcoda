import { defineQueries } from '@rocicorp/zero';

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
import { listPetitionSignatures as listPetitionSignaturesForPetition } from '$lib/zero/query/petition/signatures';

// petition_signature
import { listPetitionSignatures } from '$lib/zero/query/petition_signature/list';
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

// Re-export all queries
export {
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
	listWebhooks
};

export default defineQueries({
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
		signatures: listPetitionSignaturesForPetition
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
		list: listWebhooks
	}
});
