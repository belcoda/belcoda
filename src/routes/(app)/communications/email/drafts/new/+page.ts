import { v7 as uuidv7 } from 'uuid';
import { redirect } from '@sveltejs/kit';

/**
 * Create a new draft identifier and redirect the request to the email composer for that draft.
 *
 * The redirect includes `defaultCreateMode=true` as a hint for the composer to bootstrap in new-draft mode; the page will still check whether an email with the generated id exists and populate the composer if it does.
 *
 * @throws A 302 redirect to `/communications/email/drafts/{emailId}?defaultCreateMode=true`.
 */
export async function load() {
	const emailId = uuidv7();
	// defaultCreateMode is used to indicate that this is a new email draft.
	// This is just a hint to allow the page to bootstrap the new email composer before checking zero to see if the email exists.
	// The check will still happen, and if there is an email with the same id, it will be used to populate the composer.
	throw redirect(302, `/communications/email/drafts/${emailId}?defaultCreateMode=true`);
}
