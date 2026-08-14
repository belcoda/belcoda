<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { appState } from '$lib/state.svelte';
	import { authClient } from '$lib/auth-client';
	import { safeSessionStorage } from '$lib/utils/storage';
	import { determineAndPersistActiveOrganizationId } from '$lib/utils/organization';
	import { zero } from '$lib/zero.svelte';
	import { onDestroy, onMount } from 'svelte';
	import DeploymentRecoveryReset from '$lib/utils/DeploymentRecoveryReset.svelte';
	import OrganizationOnboarding from '$lib/components/widgets/organization-onboarding/OrganizationOnboarding.svelte';

	const { children, data } = $props();

	function setOrganizationIdState(organizationId: string) {
		appState.organizationId = organizationId;
		safeSessionStorage.setItem('state:organizationId', organizationId);
	}

	let initialized = $state(false);

	$effect.pre(() => {
		if (initialized) return;
		const userId = data.userId;
		const queryContext = data.queryContext;
		const defaultActiveOrganizationId = data.defaultActiveOrganizationId;
		if (!userId || !queryContext || !defaultActiveOrganizationId) return;

		zero.init(userId, queryContext);
		appState.init({
			userId,
			organizationId: determineAndPersistActiveOrganizationId({
				queryParamOrganizationId: data.queryParamOrganizationId,
				inferredOrganizationId: data.inferredOrganizationId,
				defaultActiveOrganizationId,
				memberships: data.memberships,
				setOrganizationIdState
			}),
			queryContext
		});
		initialized = true;
	});

	$effect(() => {
		if (!initialized) return;
		const organizationId = determineAndPersistActiveOrganizationId({
			queryParamOrganizationId: data.queryParamOrganizationId,
			inferredOrganizationId: data.inferredOrganizationId,
			defaultActiveOrganizationId: data.defaultActiveOrganizationId,
			memberships: data.memberships,
			setOrganizationIdState
		});
		appState.organizationId = organizationId;
		authClient.organization.setActive({ organizationId });
	});

	onMount(async () => {
		try {
			await authClient.organization.setActive({
				organizationId: appState.organizationId
			});
		} catch (error) {
			console.error('Failed to set active organization:', error);
		}
	});

	onDestroy(() => {
		appState.clearOrganizationContext();
	});
</script>

{#if zero.hasInstance && appState.layoutBootstrapComplete}
	<DeploymentRecoveryReset />
	{#if appState.organizationNeedsOnboarding}
		<OrganizationOnboarding />
	{:else}
		{@render children()}
	{/if}
{:else}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
