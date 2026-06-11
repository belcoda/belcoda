<script lang="ts">
	import DeploymentRecoveryReset from '$lib/utils/DeploymentRecoveryReset.svelte';
	const { children } = $props();
</script>

<DeploymentRecoveryReset />
{@render children()}
