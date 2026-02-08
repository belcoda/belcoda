<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import {
		type ReadPersonNoteWithUserZero,
		deleteMutatorSchemaZero
	} from '$lib/schema/person-note';
	import { parse } from 'valibot';
	import { getTimeAgo } from '$lib/utils/time';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';
	import { appState } from '$lib/state.svelte';
	import { locale, t } from '$lib/index.svelte';
	const timeAgo = getTimeAgo(locale.current);
	const { note }: { note: ReadPersonNoteWithUserZero } = $props();
	let editOpen = $state(false);
	import EditNote from '$lib/components/layouts/app/action-menus/person/notes/EditNote.svelte';

	const canEditDelete = $derived(note.userId === appState.userId || appState.isAdminOrOwner);

	function deleteNote() {
		if (!canEditDelete) return;
		if (window.confirm(t`Are you sure you want to delete this note?`)) {
			const parsed = parse(deleteMutatorSchemaZero, {
				metadata: {
					personId: note.personId,
					userId: appState.userId,
					organizationId: appState.organizationId,
					personNoteId: note.id
				}
			});
			const input = z.mutate.personNote.delete(parsed);
			toast.success(t`Note deleted`);
		}
	}
</script>

<Item.Root variant="outline">
	<Item.Media variant="image">
		<Avatar
			src={note.user?.image}
			alt={note.user?.name}
			name1={note.user?.name || 'User'}
			name2={note.user?.email}
		/>
	</Item.Media>
	<Item.Content>
		<div class="flex w-full items-center justify-between gap-2">
			<div>
				<Item.Title class="">
					<div>{note.user?.name || 'User'}</div>
				</Item.Title>
				<Item.Description class="text-xs">
					<!-- typescript has a problem with 'short' even though it is a valid format-->
					{timeAgo.format(note.createdAt, 'short' as 'twitter')}
				</Item.Description>
			</div>
			{#if canEditDelete}
				<div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button size="icon" class="px-1 py-0.5 text-muted-foreground" variant="ghost"
								><EllipsisIcon /></Button
							>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							{#if !editOpen}<DropdownMenu.Item onclick={() => (editOpen = true)}
									>{t`Edit`}</DropdownMenu.Item
								>{/if}
							<DropdownMenu.Item onclick={() => deleteNote()}>{t`Delete`}</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			{/if}
		</div>
		{#if editOpen}
			<EditNote {note} bind:editOpen />
		{:else}
			<div class="prose prose-sm">{note.note}</div>
		{/if}
	</Item.Content>
</Item.Root>
