const pageSize = { $ref: '#/components/parameters/PageSize' };
const search = { $ref: '#/components/parameters/Search' };
const startAfter = { $ref: '#/components/parameters/StartAfter' };

const personId = { $ref: '#/components/parameters/PersonId' };
const noteId = { $ref: '#/components/parameters/NoteId' };
const tagId = { $ref: '#/components/parameters/TagId' };
const teamId = { $ref: '#/components/parameters/TeamId' };
const eventId = { $ref: '#/components/parameters/EventId' };
const eventSignupId = { $ref: '#/components/parameters/EventSignupId' };
const petitionId = { $ref: '#/components/parameters/PetitionId' };
const signatureId = { $ref: '#/components/parameters/SignatureId' };

export const params = {
	list: [pageSize, search, startAfter],
	personId: [personId],
	personAndNoteId: [personId, noteId],
	personAndTagId: [personId, tagId],
	personAndTeamId: [personId, teamId],
	eventId: [eventId],
	eventAndSignupId: [eventId, eventSignupId],
	petitionId: [petitionId],
	petitionAndSignatureId: [petitionId, signatureId],
	tagId: [tagId],
	teamId: [teamId]
} as const;
