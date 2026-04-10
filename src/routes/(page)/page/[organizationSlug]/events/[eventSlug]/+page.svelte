<script lang="ts">
	import { t } from '$lib/index.svelte';
	const { data } = $props();
	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';

	const paramLayout = page.url.searchParams.get('layout') || 'default';
	const layouts = ['default', 'embed'];
	const layout = layouts.includes(paramLayout) ? (paramLayout as 'default' | 'embed') : 'default';

	// Build the edit URL: strip the subdomain and go to the main app
	const editEventUrl = $derived(`${env.PUBLIC_HOST}/events/${data.event.id}`);

	import UserNavBar from '$lib/components/layouts/public/UserNavBar.svelte';
</script>

<UserNavBar session={data.session} linkUrl={editEventUrl} linkText={t`Edit Event`} />

<RenderEventPage
	event={data.event}
	organization={data.organization}
	{layout}
	form={data.form}
	whatsAppSignupLink={data.whatsAppSignupLink ?? undefined}
	signupCount={data.signupCount ?? undefined}
/>
