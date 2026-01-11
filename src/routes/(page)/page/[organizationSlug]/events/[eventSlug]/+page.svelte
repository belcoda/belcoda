<script lang="ts">
	const { data } = $props();
	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
</script>

<RenderEventPage
	event={data.event}
	organization={data.organization}
	form={data.form}
	whatsAppSignupLink={data.whatsAppSignupLink}
/>
