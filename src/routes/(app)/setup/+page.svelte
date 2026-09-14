<script lang="ts">
	import SetupPage from '$lib/components/widgets/organization-onboarding/SetupPage.svelte';
	import InviteTeammatesDrawer from '$lib/components/widgets/organization-onboarding/InviteTeammatesDrawer.svelte';
	import OnboardingLayout from '$lib/components/widgets/organization-onboarding/OnboardingLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';

	let inviteOpen = $state(false);
	const organization = $derived(appState.activeOrganization.data);
</script>

<svelte:head>
	<title>{t`Set up your organization`}</title>
</svelte:head>

{#if organization}
	{#if appState.isAdminOrOwner}
		{#key organization.id}
			<SetupPage {organization} oninvite={() => (inviteOpen = true)} />
			<InviteTeammatesDrawer bind:open={inviteOpen} />
		{/key}
	{:else}
		<OnboardingLayout orgName={organization.name} exitLabel={t`Go to dashboard`}>
			<p>{t`An organization admin or owner can update these settings.`}</p>
		</OnboardingLayout>
	{/if}
{/if}
