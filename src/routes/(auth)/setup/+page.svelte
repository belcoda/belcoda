<script lang="ts">
	import SetupPage from '$lib/components/widgets/organization-onboarding/SetupPage.svelte';
</script>

<svelte:head>
	<title>Set up your organization</title>
</svelte:head>

<SetupPage oninvite={() => console.log('open invite drawer')} />
