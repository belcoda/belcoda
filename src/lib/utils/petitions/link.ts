import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

export function getPetitionLink({
	petitionSlug,
	organizationSlug
}: {
	petitionSlug: string;
	organizationSlug: string;
}) {
	return `http${dev ? '' : 's'}://${organizationSlug}.${env.PUBLIC_ROOT_DOMAIN}/petitions/${petitionSlug}`;
}

export function generateWhatsAppPetitionLink({
	petitionTitle,
	whatsAppNumber,
	actionCode
}: {
	petitionTitle: string;
	whatsAppNumber?: string | null;
	actionCode: string;
}) {
	return `https://wa.me/${whatsAppNumber || env.PUBLIC_DEFAULT_WHATSAPP_NUMBER}/?text=${encodeURIComponent(`Sign petition for ${petitionTitle} #[${actionCode}] (do not edit this message)`)}`;
}
