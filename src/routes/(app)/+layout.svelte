<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	const { children, data } = $props();
	import { appState } from '$lib/state.svelte';
	import { authClient } from '$lib/auth-client';
	// svelte-ignore state_referenced_locally
	const {
		userId,
		defaultActiveOrganizationId,
		inferredOrganizationId,
		queryParamOrganizationId,
		memberships,
		queryContext
	} = data;
	function setOrganizationIdState(organizationId: string) {
		appState.organizationId = organizationId;
		sessionStorage.setItem('state:organizationId', organizationId);
	}

	function determineAndPersistActiveOrganizationId({
		queryParamOrganizationId,
		inferredOrganizationId,
		defaultActiveOrganizationId,
		memberships
	}: {
		queryParamOrganizationId: string | null | undefined;
		inferredOrganizationId: string | null | undefined;
		defaultActiveOrganizationId: string;
		memberships: { organizationId: string }[];
	}) {
		if (queryParamOrganizationId) {
			setOrganizationIdState(queryParamOrganizationId);
			return queryParamOrganizationId;
		}
		const existingSessionStorageOrganizationId = sessionStorage.getItem('state:organizationId');
		if (inferredOrganizationId) {
			setOrganizationIdState(inferredOrganizationId);
			return inferredOrganizationId;
		} else if (existingSessionStorageOrganizationId) {
			const sessionOrgIsMember = memberships.some(
				(m) => m.organizationId === existingSessionStorageOrganizationId
			);
			const validatedOrganizationId = sessionOrgIsMember
				? existingSessionStorageOrganizationId
				: defaultActiveOrganizationId;
			setOrganizationIdState(validatedOrganizationId);
			return validatedOrganizationId;
		} else {
			setOrganizationIdState(defaultActiveOrganizationId);
			return defaultActiveOrganizationId;
		}
	}
	//initialize the zero instance with the user id and query context
	// IMPORTANT: this must be done before the appState is created, because the appState relies on the zero instance
	import { zero } from '$lib/zero.svelte';
	zero.init(userId, queryContext);
	appState.init({
		userId,
		organizationId: determineAndPersistActiveOrganizationId({
			queryParamOrganizationId,
			inferredOrganizationId,
			defaultActiveOrganizationId,
			memberships
		}),
		queryContext
	});

	//keep the active organization id in sync with the inferred organization id and the default active organization id
	$effect(() => {
		const organizationId = determineAndPersistActiveOrganizationId({
			queryParamOrganizationId,
			inferredOrganizationId,
			defaultActiveOrganizationId,
			memberships
		});
		appState.organizationId = organizationId;
		authClient.organization.setActive({ organizationId });
	});

	//conditional onboarding components based on the user's onboarding status
	import Onboarding from '$lib/components/widgets/tutorial/onboarding/Onboarding.svelte';

	import { onMount } from 'svelte';

	onMount(async () => {
		try {
			await authClient.organization.setActive({
				organizationId: appState.organizationId
			});
		} catch (error) {
			console.error('Failed to set active organization:', error);
			// Consider fallback behavior or user notification
		}
	});
</script>

<!-- This is an important check to ensure that we always have a valid userId and active organization Id. These will be used with confidence throughout the rest of the application interface -->
{#if zero.instance && appState.user?.details.type === 'complete' && appState.activeOrganization?.details.type === 'complete' && appState.organizations?.details.type === 'complete'}
	<Onboarding />
	{@render children()}
{:else}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
