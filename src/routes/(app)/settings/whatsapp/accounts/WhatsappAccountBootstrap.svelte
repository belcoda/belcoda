<script lang="ts">
	import { onMount } from 'svelte';
	import { appState } from '$lib/state.svelte';
	import { whatsappAccountState } from './whatsapp_account_state.svelte';

	let { configured }: { configured: boolean } = $props();

	onMount(() => {
		const organizationId = appState.organizationId;
		if (configured && organizationId) {
			void whatsappAccountState.load(organizationId);
		} else {
			whatsappAccountState.reset();
		}

		return () => {
			whatsappAccountState.reset();
		};
	});
</script>
