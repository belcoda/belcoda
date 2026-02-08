<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import type { ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';
	let {
		open = $bindable(false),
		children,
		person
	}: {
		open: boolean;
		children: Snippet<[{ props: Record<string, unknown> }]>;
		person: ReadPersonOutputWithReadonlyArrays;
	} = $props();

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { getTimeAgo } from '$lib/utils/time';
	import { locale, t } from '$lib/index.svelte';
	const timeAgo = getTimeAgo(locale.current);
	import PersonNote from '$lib/components/layouts/app/action-menus/person/notes/PersonNote.svelte';
	import PersonNoteForm from '$lib/components/layouts/app/action-menus/person/notes/PersonNoteForm.svelte';

	import { listPersonNotes } from '$lib/zero/query/person_note/list';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import { z } from '$lib/zero.svelte';
	const notes = $derived.by(() =>
		z.createQuery(
			listPersonNotes(appState.queryContext, {
				...getListFilter(appState.organizationId),
				personId: person.id
			})
		)
	);

	import XIcon from '@lucide/svelte/icons/x';
</script>

<Drawer.Root bind:open direction="right">
	<Drawer.Trigger>
		{#snippet child({ props })}
			{@render children?.({ props: props as Record<string, unknown> })}
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="border-b">
			<div class="mb-1 flex items-center justify-between">
				<h2 class="text-xl font-medium">{t`Notes`}</h2>
				<Drawer.Close class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
					><XIcon class="size-4" /></Drawer.Close
				>
			</div>
			<PersonNoteForm personId={person.id} />
		</Drawer.Header>
		<div class="space-y-4 overflow-y-auto p-4">
			{#if notes.data && notes.data.length > 0}
				{#each notes.data as note (note.id)}
					<PersonNote
						note={{
							...note,
							user: { ...note.user!, twoFactorEnabled: note.user?.twoFactorEnabled ?? false }
						}}
					/>
				{/each}
			{:else}
				<div class="flex items-center justify-center">
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<MessageCircleIcon />
							</Empty.Media>
							<Empty.Title>{t`No notes found`}</Empty.Title>
							<Empty.Description
								>{t`Add a note to share information with the team`}</Empty.Description
							>
						</Empty.Header>
					</Empty.Root>
				</div>
			{/if}
		</div>
	</Drawer.Content>
</Drawer.Root>
