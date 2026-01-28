<script lang="ts">
	const { data } = $props();
	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
	import { page } from '$app/state';
	const paramTheme = page.url.searchParams.get('theme') || 'default';
	const themes = ['default', 'embed'];
	const theme = themes.includes(paramTheme) ? (paramTheme as 'default' | 'embed') : 'default';
</script>

<RenderEventPage
	event={data.event}
	organization={data.organization}
	{theme}
	form={data.form}
	whatsAppSignupLink={data.whatsAppSignupLink}
/>
