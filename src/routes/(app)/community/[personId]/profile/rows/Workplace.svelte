<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import WorkplaceForm from './form/Workplace.svelte';
	import { type ReadPersonZero } from '$lib/schema/person';
	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import { cn } from '$lib/utils';
	import { formatDate } from '$lib/utils/date';
	import { renderGender } from '$lib/utils/person/gender/render';
	import * as Item from '$lib/components/ui/item/index.js';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
	import { t } from '$lib/index.svelte';
</script>

<ProfileRow title={t`Workplace`} separator={false} showCopyButton={false} bind:edit>
	{#if edit}
		<WorkplaceForm bind:edit {person} />
	{:else}
		<div class="flex flex-col gap-2">
			<Item.Root class="p-0">
				<Item.Media variant="icon">
					<Building2Icon
						class={cn('size-4', person.gender ? 'text-foreground' : 'text-muted-foreground')}
					/>
				</Item.Media>
				<Item.Content>
					{#if person.workplace}
						<Item.Title class="font-normal">
							{person.workplace}
						</Item.Title>
					{:else}
						<Item.Description>{t`Not specified`}</Item.Description>
					{/if}
				</Item.Content>
			</Item.Root>
			<Item.Root class="p-0">
				<Item.Media variant="icon">
					<BriefcaseIcon
						class={cn('size-4', person.gender ? 'text-foreground' : 'text-muted-foreground')}
					/>
				</Item.Media>
				<Item.Content>
					{#if person.position}
						<Item.Title class="font-normal">
							{person.position}
						</Item.Title>
					{:else}
						<Item.Description>{t`Not specified`}</Item.Description>
					{/if}
				</Item.Content>
			</Item.Root>
		</div>
	{/if}
</ProfileRow>
