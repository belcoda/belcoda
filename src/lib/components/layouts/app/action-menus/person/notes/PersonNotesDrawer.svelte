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
	import NoteComposer from '$lib/components/widgets/notes/NoteComposer.svelte';

	import queries from '$lib/zero/query/index';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import { z } from '$lib/zero.svelte';
	import { type PersonNoteListRow, type ReadPersonNoteWithUserZero } from '$lib/schema/person-note';
	import type { ListPersonNotesInput } from '$lib/zero/query/person_note/list';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodePersonNoteListCursor } from '$lib/utils/person-note/cursor';
	import { IsInViewport, watch } from 'runed';
	import { formatNumber } from '$lib/utils/number';

	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));
	const paginatedNotes = new PaginatedZeroList<ListPersonNotesInput, PersonNoteListRow>({
		getBaseFilter: () => ({
			...getListFilter(appState.organizationId),
			personId: person.id
		}),
		encodeCursor: encodePersonNoteCursor,
		pageSize
	});
	const notesQuery = $derived.by(() =>
		z.createQuery(queries.personNote.list(paginatedNotes.pageFilter))
	);

	watch(
		() => person.id,
		() => {
			paginatedNotes.reset();
		}
	);
	watch(
		() => notesQuery.data,
		(data) => {
			paginatedNotes.handlePage(data as PersonNoteListRow[] | undefined);
		}
	);
	watch(
		() =>
			[sentinelIsInViewport.current, paginatedNotes.hasMore, paginatedNotes.items.length] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedNotes.loadMore();
			}
		}
	);

	function encodePersonNoteCursor(note: PersonNoteListRow) {
		return encodePersonNoteListCursor({
			createdAt: note.createdAt,
			id: note.id
		});
	}

	function onNotesChanged() {
		paginatedNotes.reset();
	}

	import XIcon from '@lucide/svelte/icons/x';
</script>

<Drawer.Root bind:open direction="right">
	<Drawer.Trigger>
		{#snippet child({ props })}
			{@render children?.({ props: props as Record<string, unknown> })}
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content data-testid="person-notes-drawer">
		<Drawer.Header class="border-b">
			<div class="mb-1 flex items-center justify-between">
				<h2 class="text-xl font-medium">{t`Notes`}</h2>
				<Drawer.Close class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
					><XIcon class="size-4" /></Drawer.Close
				>
			</div>
			<NoteComposer personId={person.id} onSaved={onNotesChanged} />
		</Drawer.Header>
		<div class="space-y-4 overflow-y-auto p-4" data-testid="person-notes-list">
			{#if paginatedNotes.items.length > 0}
				{#each paginatedNotes.items as note (note.id)}
					<PersonNote
						note={{
							...note,
							user: {
								...note.user!,
								twoFactorEnabled: note.user?.twoFactorEnabled ?? false
							}
						} as ReadPersonNoteWithUserZero}
						{onNotesChanged}
					/>
				{/each}
				{#if paginatedNotes.hasMore}
					<div bind:this={sentinel} class="h-1" data-testid="person-notes-scroll-sentinel"></div>
				{/if}
				<div class="pt-2 text-center text-xs text-muted-foreground">
					{t`${formatNumber(paginatedNotes.items.length, locale.current)} shown`}
				</div>
			{:else if notesQuery.data}
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
