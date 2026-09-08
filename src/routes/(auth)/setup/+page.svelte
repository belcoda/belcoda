<script lang="ts">
	import SetupPage from '$lib/components/widgets/organization-onboarding/SetupPage.svelte';
	import InviteTeammatesDrawer from '$lib/components/widgets/organization-onboarding/InviteTeammatesDrawer.svelte';

	let inviteOpen = $state(false);
</script>

<svelte:head>
	<title>Set up your organization</title>
</svelte:head>

<SetupPage oninvite={() => (inviteOpen = true)} />
<InviteTeammatesDrawer bind:open={inviteOpen} />
