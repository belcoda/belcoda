<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';
	import {
		deleteMutatorSchemaZero,
		type ReadPersonNoteWithUserZero
	} from '$lib/schema/person-note';
	import { parse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { locale, t } from '$lib/index.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { toast } from 'svelte-sonner';

	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import LockIcon from '@lucide/svelte/icons/lock';
	import EditNote from '$lib/components/layouts/app/action-menus/person/notes/EditNote.svelte';
	import NoteBody from '$lib/components/widgets/notes/NoteBody.svelte';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();

	const noteQuery = $derived.by(() =>
		z.createQuery(queries.personNote.read({ personNoteId: activity.referenceId }))
	);
	const note = $derived(noteQuery.data);

	let editOpen = $state(false);

	const canEditDelete = $derived(note?.userId === appState.userId || appState.isAdminOrOwner);
	const authorName = $derived(note?.user?.name || t`User`);

	// EditNote takes the valibot row shape; the drawer shapes it the same way.
	const noteForEdit = $derived(
		note
			? ({
					...note,
					user: { ...note.user!, twoFactorEnabled: note.user?.twoFactorEnabled ?? false }
				} as ReadPersonNoteWithUserZero)
			: undefined
	);

	function deleteNote() {
		if (!canEditDelete || !note) return;
		if (window.confirm(t`Are you sure you want to delete this note?`)) {
			const parsed = parse(deleteMutatorSchemaZero, {
				metadata: {
					personId: note.personId,
					userId: appState.userId,
					organizationId: appState.organizationId,
					personNoteId: note.id
				}
			});
			z.mutate(mutators.personNote.delete(parsed));
			toast.success(t`Note deleted`);
		}
	}
</script>

<!-- A deleted note leaves its note_added activity behind, so drop the whole row rather
	 than rendering an empty card. -->
{#if note && !note.deletedAt}
	<div
		id={`note-${note.id}`}
		class="rounded-lg border border-amber-300 border-l-[3px] border-l-amber-600 bg-amber-50 px-3 py-2"
		data-testid="inline-note"
		data-note-id={note.id}
	>
		<div class="flex flex-wrap items-center gap-2">
			<Avatar
				src={note.user?.image}
				alt={note.user?.name}
				name1={authorName}
				name2={note.user?.email}
				class="size-5"
			/>
			<span class="text-xs font-semibold text-amber-950">{authorName}</span>
			<span
				class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-900 uppercase"
			>
				<LockIcon class="size-2.5" />
				{t`Internal note`}
			</span>
			<span class="ms-auto flex items-center gap-1 text-xs text-amber-700">
				{formatShortTimestamp(note.createdAt, locale.current)}
				{#if canEditDelete}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button
								size="icon"
								class="size-5 text-amber-800 hover:bg-amber-100"
								variant="ghost"
								aria-label={t`Note actions`}><EllipsisIcon /></Button
							>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							{#if !editOpen}<DropdownMenu.Item onclick={() => (editOpen = true)}
									>{t`Edit`}</DropdownMenu.Item
								>{/if}
							<DropdownMenu.Item onclick={() => deleteNote()}>{t`Delete`}</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</span>
		</div>

		{#if editOpen && noteForEdit}
			<div class="mt-2">
				<EditNote note={noteForEdit} bind:editOpen />
			</div>
		{:else}
			<NoteBody note={note.note} class="mt-1 text-amber-950" />
		{/if}

		<div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700">
			<EyeOffIcon class="size-3" />
			{t`Only your team can see this`}
		</div>
	</div>
{/if}
