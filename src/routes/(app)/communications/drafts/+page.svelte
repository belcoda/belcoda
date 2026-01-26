<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/communications/drafts/email', { replaceState: true });
	});
</script>
