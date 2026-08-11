<script lang="ts">
	import { tick, type ComponentProps } from 'svelte';
	import { useId } from 'bits-ui';
	import { v7 as uuidv7 } from 'uuid';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { t } from '$lib/index.svelte';
	import type { WritePersonNoteMentionZero } from '$lib/schema/person-note-mention';
	import {
		adjustMentionsForTextChange,
		findActiveMentionQuery,
		insertMention,
		type ActiveMentionQuery
	} from '$lib/utils/person-note/mentions';

	type TextareaProps = ComponentProps<typeof InputGroup.Textarea>;
	type Props = Omit<TextareaProps, 'value' | 'ref'> & {
		value?: string;
		mentions?: WritePersonNoteMentionZero[];
		ref?: HTMLTextAreaElement | null;
	};

	let {
		value = $bindable(''),
		mentions = $bindable([]),
		ref = $bindable(null),
		onbeforeinput,
		oninput,
		onkeydown,
		onkeyup,
		onclick,
		onblur,
		...textareaProps
	}: Props = $props();

	const listboxId = `note-mention-list-${useId()}`;
	let activeQuery = $state<ActiveMentionQuery | null>(null);
	let selectedIndex = $state(0);
	let previousNote = value;

	const usersFilter = $derived(
		getListFilter(appState.organizationId, {
			pageSize: 8,
			searchString: activeQuery?.searchString || null
		})
	);
	const usersQuery = $derived.by(() =>
		activeQuery ? z.createQuery(queries.user.list(usersFilter)) : null
	);
	const users = $derived(
		[...(usersQuery?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
	);

	function updateActiveQuery(textarea: HTMLTextAreaElement) {
		const nextQuery = findActiveMentionQuery(textarea.value, textarea.selectionStart, mentions);
		if (
			nextQuery?.startIndex !== activeQuery?.startIndex ||
			nextQuery?.searchString !== activeQuery?.searchString
		) {
			selectedIndex = 0;
		}
		activeQuery = nextQuery;
	}

	function selectUser(user: { id: string; name: string }) {
		if (!activeQuery) return;
		const inserted = insertMention(value, activeQuery, mentions, user, uuidv7());
		value = inserted.note;
		mentions = inserted.mentions;
		previousNote = inserted.note;
		activeQuery = null;
		tick().then(() => {
			ref?.focus();
			ref?.setSelectionRange(inserted.cursor, inserted.cursor);
		});
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
		if (activeQuery && users.length > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				selectedIndex = (selectedIndex + 1) % users.length;
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				selectedIndex = (selectedIndex - 1 + users.length) % users.length;
			} else if (
				(event.key === 'Enter' || event.key === 'Tab') &&
				!event.shiftKey &&
				!event.metaKey &&
				!event.ctrlKey &&
				!event.altKey
			) {
				event.preventDefault();
				selectUser(users[selectedIndex] ?? users[0]);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				activeQuery = null;
			}
		} else if (activeQuery && event.key === 'Escape') {
			event.preventDefault();
			activeQuery = null;
		}
		onkeydown?.(event);
	}
</script>

<InputGroup.Textarea
	{...textareaProps}
	bind:ref
	bind:value
	role="combobox"
	aria-autocomplete="list"
	aria-haspopup="listbox"
	aria-expanded={activeQuery !== null}
	aria-controls={activeQuery ? listboxId : undefined}
	aria-activedescendant={activeQuery && users.length > 0
		? `${listboxId}-${users[selectedIndex]?.id ?? users[0]?.id}`
		: undefined}
	onbeforeinput={(event) => {
		previousNote = event.currentTarget.value;
		onbeforeinput?.(event);
	}}
	oninput={(event) => {
		const nextNote = event.currentTarget.value;
		mentions = adjustMentionsForTextChange(previousNote, nextNote, mentions);
		value = nextNote;
		previousNote = nextNote;
		updateActiveQuery(event.currentTarget);
		oninput?.(event);
	}}
	onkeydown={handleKeydown}
	onkeyup={(event) => {
		if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
			updateActiveQuery(event.currentTarget);
		}
		onkeyup?.(event);
	}}
	onclick={(event) => {
		updateActiveQuery(event.currentTarget);
		onclick?.(event);
	}}
	onblur={(event) => {
		activeQuery = null;
		onblur?.(event);
	}}
/>

{#if activeQuery}
	<div
		id={listboxId}
		role="listbox"
		aria-label={t`Mention a user`}
		class="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
		data-testid="note-mention-picker"
	>
		{#if usersQuery?.details.type === 'error'}
			<p class="px-3 py-4 text-center text-sm text-muted-foreground">
				{t`Unable to load organization members.`}
			</p>
		{:else if usersQuery?.details.type === 'unknown'}
			<p class="px-3 py-4 text-center text-sm text-muted-foreground">{t`Loading users...`}</p>
		{:else if users.length === 0}
			<p class="px-3 py-4 text-center text-sm text-muted-foreground">{t`No users found.`}</p>
		{:else}
			{#each users as user, index (user.id)}
				<button
					id={`${listboxId}-${user.id}`}
					type="button"
					role="option"
					aria-selected={index === selectedIndex}
					class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm hover:bg-accent aria-selected:bg-accent"
					data-testid="note-mention-option"
					onmouseenter={() => (selectedIndex = index)}
					onmousedown={(event) => {
						event.preventDefault();
						selectUser(user);
					}}
				>
					<Avatar
						class="size-7 shrink-0 text-[10px]"
						src={user.image}
						alt={user.name}
						name1={user.name}
						name2={user.email}
					/>
					<span class="min-w-0">
						<span class="block truncate font-medium">{user.name}</span>
						<span class="block truncate text-xs text-muted-foreground">{user.email}</span>
					</span>
				</button>
			{/each}
		{/if}
	</div>
{/if}
