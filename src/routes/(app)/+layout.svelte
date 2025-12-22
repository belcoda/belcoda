<script lang="ts">
	const { children } = $props();
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import { appState } from '$lib/state.svelte';

	onMount(async () => {
		const session = await authClient.getSession();
		if (session.error) {
			console.error(session.error);
			throw new Error('Error getting session');
		}
		if (!session.data?.user?.id) {
			throw new Error('No user id found');
		}

		await appState.loadQueryContext();

		if (session.data.session.activeOrganizationId) {
			appState.setUserId(session.data.user.id);
			appState.setOrganizationId(session.data.session.activeOrganizationId);
		} else {
			const organizationsList = await authClient.organization.list();
			if (organizationsList.error) {
				console.error(organizationsList.error);
				throw new Error('Error getting organizations list');
			}
			if (organizationsList.data && organizationsList.data.length > 0) {
				// gotta set these two together, otherwise there will be a race condition...
				appState.setUserId(session.data.user.id);
				appState.setOrganizationId(organizationsList.data[0].id);
			} else {
				await goto(`/organization`);
			}
		}
	});

	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { goto } from '$app/navigation';
</script>

<!-- This is an important check to ensure that we always have a valid userId and active organization Id. These will be used with confidence throughout the rest of the application interface -->
{#if appState.user.details.type === 'complete' && appState.activeOrganization.details.type === 'complete' && appState.organizations.details.type === 'complete'}
	{@render children()}
{:else}
	{JSON.stringify(appState.user.details)}
	{JSON.stringify(appState.activeOrganization.details)}
	{JSON.stringify(appState.organizations.details)}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
