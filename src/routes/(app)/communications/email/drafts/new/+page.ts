import { v7 as uuidv7 } from 'uuid';
import { redirect } from '@sveltejs/kit';
export async function load() {
	const emailId = uuidv7();
	redirect(302, `/communications/email/drafts/${emailId}?defaultCreateMode=true`);
	// defaultCreateMode is used to indicate that this is a new email draft.
	// This is just a hint to allow the page to bootstrap the new email composer before checking zero to see if the email exists.
	// The check will still happen, and if there is an email with the same id, it will be used to populate the composer.
}
