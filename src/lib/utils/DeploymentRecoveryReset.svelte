<script lang="ts">
	import { onMount } from 'svelte';
	import { clearDeploymentReloadFlag } from '$lib/utils/deployment-recovery';

	onMount(() => {
		clearDeploymentReloadFlag();
	});
</script>
