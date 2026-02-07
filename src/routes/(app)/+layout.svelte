<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	const { children, data } = $props();
	import { createAppState, setAppState, getAppState } from '$lib/state.svelte';
	// svelte-ignore state_referenced_locally
	const { session, queryContext, organizations, defaultActiveOrganizationId } = data;

	//initialize the zero instance with the user id and query context
	// IMPORTANT: this must be done before the appState is created, because the appState relies on the zero instance
	import { zero } from '$lib/zero.svelte';
	zero.init(session.user.id, queryContext);
	const appStateInstance = createAppState({
		session,
		initialQueryContext: queryContext,
		defaultActiveOrganizationId
	});
	setAppState(appStateInstance);
	const appState = getAppState();
</script>

<!-- This is an important check to ensure that we always have a valid userId and active organization Id. These will be used with confidence throughout the rest of the application interface -->
{#if zero.instance && appState.user?.details.type === 'complete' && appState.activeOrganization?.details.type === 'complete' && appState.organizations?.details.type === 'complete'}
	{@render children()}
{:else}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
