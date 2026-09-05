<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let {
		teamName = $bindable('')
	}: {
		teamName?: string;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label for="onboarding-team-name">{t`Team name`}</Label>
	<Input id="onboarding-team-name" bind:value={teamName} placeholder={t`e.g. Field organisers`} />
</div>
