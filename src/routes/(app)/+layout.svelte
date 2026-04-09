<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { appState } from '$lib/state.svelte';
	import { authClient } from '$lib/auth-client';
	import { zero } from '$lib/zero.svelte';
	import Onboarding from '$lib/components/widgets/tutorial/onboarding/Onboarding.svelte';
	import { onMount } from 'svelte';

	const { children, data } = $props();

	function setOrganizationIdState(organizationId: string) {
		appState.organizationId = organizationId;
		sessionStorage.setItem('state:organizationId', organizationId);
	}

	function determineAndPersistActiveOrganizationId({
		inferredOrganizationId,
		defaultActiveOrganizationId,
		organizations
	}: {
		inferredOrganizationId: string | null | undefined;
		defaultActiveOrganizationId: string;
		organizations: { organizationId: string }[];
	}) {
		const existingSessionStorageOrganizationId = sessionStorage.getItem('state:organizationId');
		if (inferredOrganizationId) {
			setOrganizationIdState(inferredOrganizationId);
			return inferredOrganizationId;
		} else if (existingSessionStorageOrganizationId) {
			const sessionOrgIsMember = organizations.some(
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
				inferredOrganizationId: data.inferredOrganizationId,
				defaultActiveOrganizationId,
				organizations: data.organizations
			}),
			queryContext
		});
		initialized = true;
	});

	$effect(() => {
		if (!initialized) return;
		const organizationId = determineAndPersistActiveOrganizationId({
			inferredOrganizationId: data.inferredOrganizationId,
			defaultActiveOrganizationId: data.defaultActiveOrganizationId,
			organizations: data.organizations
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
</script>

{#if zero.hasInstance && appState.layoutBootstrapComplete}
	<Onboarding />
	{@render children()}
{:else}
	<div class="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
{/if}
