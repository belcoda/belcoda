<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	const { children, data } = $props();
	import { appState } from '$lib/state.svelte';
	// svelte-ignore state_referenced_locally
	const { userId, defaultActiveOrganizationId, queryContext } = data;

	//initialize the zero instance with the user id and query context
	// IMPORTANT: this must be done before the appState is created, because the appState relies on the zero instance
	import { zero } from '$lib/zero.svelte';
	zero.init(userId, queryContext);
	appState.init({ userId, organizationId: defaultActiveOrganizationId, queryContext });
</script>

<!-- This is an important check to ensure that we always have a valid userId and active organization Id. These will be used with confidence throughout the rest of the application interface -->
{#if zero.instance && appState.user?.details.type === 'complete' && appState.activeOrganization?.details.type === 'complete' && appState.organizations?.details.type === 'complete'}
	{@render children()}
{:else}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
