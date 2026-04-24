<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import PersonalInfoForm from './form/PersonalInfo.svelte';
	import { type ReadPersonZero } from '$lib/schema/person';
	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import { cn } from '$lib/utils';
	import { formatTextDate } from '$lib/utils/date';
	import { renderGender } from '$lib/utils/person/gender/render';
	import * as Item from '$lib/components/ui/item/index.js';
	import VenusAndMarsIcon from '@lucide/svelte/icons/venus-and-mars';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import { t } from '$lib/index.svelte';
</script>

<ProfileRow title={t`Personal information`} separator={true} showCopyButton={false} bind:edit>
	{#if edit}
		<PersonalInfoForm bind:edit {person} />
	{:else}
		<div class="flex flex-col gap-2">
			<Item.Root class="p-0">
				<Item.Media variant="icon">
					<VenusAndMarsIcon
						class={cn('size-4', person.gender ? 'text-foreground' : 'text-muted-foreground')}
					/>
				</Item.Media>
				<Item.Content>
					{#if person.gender}
						<Item.Title class="font-normal">
							{renderGender(person.gender)}
						</Item.Title>
					{:else}
						<Item.Description>{t`Not specified`}</Item.Description>
					{/if}
				</Item.Content>
			</Item.Root>
			<Item.Root class="p-0">
				<Item.Media variant="icon">
					<CakeIcon
						class={cn('size-4', person.gender ? 'text-foreground' : 'text-muted-foreground')}
					/>
				</Item.Media>
				<Item.Content>
					{#if person.dateOfBirth}
						<Item.Title class="font-normal">
							{formatTextDate(person.dateOfBirth)}
						</Item.Title>
					{:else}
						<Item.Description>{t`Not specified`}</Item.Description>
					{/if}
				</Item.Content>
			</Item.Root>
		</div>
	{/if}
</ProfileRow>
