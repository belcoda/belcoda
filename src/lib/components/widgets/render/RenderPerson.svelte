<script lang="ts">
	import { type ReadPersonZero } from '$lib/schema/person';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	type Props = {
		person?: ReadPersonZero;
		personId: string;
		textClass?: string;
		avatarClass?: string;
		avatarImageClass?: string;
	};
	import { z } from '$lib/zero.svelte';
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();
	import { cn } from '$lib/utils.js';
	const {
		person: personProp,
		personId,
		textClass,
		avatarClass,
		avatarImageClass
	}: Props = $props();
	import { readPerson } from '$lib/zero/query/person/read';
	const person = $derived.by(() => {
		if (personProp) {
			return {
				details: { type: 'complete' },
				data: personProp
			};
		} else {
			return z.createQuery(readPerson(appState.queryContext, { personId }));
		}
	});
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { t } from '$lib/index.svelte';
</script>

{#if person.details.type === 'unknown'}
	<div class="flex items-center space-x-4">
		<Skeleton class="size-12 rounded-full" />
		<div class="space-y-2">
			<Skeleton class="h-4 w-[250px]" />
			<Skeleton class="h-4 w-[200px]" />
		</div>
	</div>
{:else if person.details.type === 'error'}
	{t`Error loading person`}
{:else if person.details.type === 'complete' && person.data}
	<div class="flex items-center gap-2">
		<div>
			<Avatar
				class={cn('aspect-square size-11 shrink-0', avatarClass)}
				name1={person.data.givenName || person.data.familyName || person.data.emailAddress || ''}
				name2={!person.data.givenName && person.data.familyName
					? undefined
					: person.data.familyName}
				src={person.data.profilePicture}
				imageClass={avatarImageClass}
			/>
		</div>
		<div>
			<div class={cn('text-sm font-medium', textClass)}>
				{person.data.givenName}
				{person.data.familyName}
			</div>
		</div>
	</div>
{/if}
