<script lang="ts">
	import { t } from '$lib/index.svelte';
	const { data } = $props();
	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';

	const paramTheme = page.url.searchParams.get('theme') || 'default';
	const themes = ['default', 'embed'];
	const theme = themes.includes(paramTheme) ? (paramTheme as 'default' | 'embed') : 'default';

	// Build the edit URL: strip the subdomain and go to the main app
	const editEventUrl = $derived.by(() => {
		const protocol = dev ? 'http' : 'https';
		return `${protocol}://${env.PUBLIC_ROOT_DOMAIN}/events/${data.event.id}`;
	});

	import UserNavBar from '$lib/components/layouts/public/UserNavBar.svelte';
</script>

<UserNavBar session={data.session} linkUrl={editEventUrl} linkText={t`Edit Event`} />

<RenderEventPage
	event={data.event}
	organization={data.organization}
	{theme}
	form={data.form}
	whatsAppSignupLink={data.whatsAppSignupLink}
/>
