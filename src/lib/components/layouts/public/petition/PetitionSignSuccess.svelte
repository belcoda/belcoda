<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { defaultDisplaySettings } from '$lib/schema/organization/settings';
	import Check from '@lucide/svelte/icons/check';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import type { ReadPetitionZero } from '$lib/schema/petition/petition';
	import type { OrganizationSchema } from '$lib/schema/organization';

	type PetitionSignSuccessPetition = Pick<ReadPetitionZero, 'title' | 'petitionTarget'>;
	type PetitionSignSuccessOrganization = Pick<OrganizationSchema, 'name' | 'settings'>;

	const {
		petition,
		organization
	}: {
		petition: PetitionSignSuccessPetition;
		organization: PetitionSignSuccessOrganization;
	} = $props();

	const secondaryColor = $derived(
		organization.settings?.theme?.secondaryColor || defaultDisplaySettings.secondaryColor
	);
</script>

<div class="p-6 text-center">
	<div
		class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
		style="background-color: {secondaryColor}20;"
	>
		<Check class="h-8 w-8" style="color: {secondaryColor};" />
	</div>
	<h3 class="mb-4 text-xl font-semibold text-gray-900">{t`Your signature is recorded`}</h3>

	<p class="mb-2 text-sm text-gray-600">{t`Thank you for signing`}</p>

	<div class="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
		<h4 class="mb-2 text-lg font-medium text-gray-900">{petition.title}</h4>
		{#if petition.petitionTarget}
			<p class="flex items-center justify-center gap-2">
				<PenLineIcon class="size-4 shrink-0" />
				<span>{petition.petitionTarget}</span>
			</p>
		{/if}
	</div>

	<p class="text-sm text-gray-600">
		{t`We will send you a confirmation email if you provided an address.`}
	</p>
</div>
