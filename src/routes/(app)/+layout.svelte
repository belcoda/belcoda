<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	const { children, data } = $props();
	import { createAppState, setAppState, getAppState } from '$lib/state.svelte';
	// svelte-ignore state_referenced_locally
	const { session, queryContext, organizations, defaultActiveOrganizationId } = data;
	const appStateInstance = createAppState({
		session,
		initialQueryContext: queryContext,
		defaultActiveOrganizationId
	});
	setAppState(appStateInstance);
	const appState = getAppState();
</script>

<!-- This is an important check to ensure that we always have a valid userId and active organization Id. These will be used with confidence throughout the rest of the application interface -->
{#if appState.user?.details.type === 'complete' && appState.activeOrganization?.details.type === 'complete' && appState.organizations?.details.type === 'complete'}
	{@render children()}
{:else}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
