<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import EmailsSidebar from '$lib/components/layouts/app/sidebars/communications/EmailsSidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<EmailsSidebar />
{/snippet}
<UniversalLayout rootNav="/communications/email/drafts" {sidebar}>
	{@render children?.()}
</UniversalLayout>
