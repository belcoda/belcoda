<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import { MEDIUM_STRING_MAX_LENGTH } from '$lib/schema/helpers';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		updateMutatorSchemaZero,
		updatePersonNoteZero,
		type ReadPersonNoteWithUserZero
	} from '$lib/schema/person-note';
	import { appState } from '$lib/state.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import { t } from '$lib/index.svelte';
	import MentionTextarea from '$lib/components/widgets/notes/MentionTextarea.svelte';
	import type { WritePersonNoteMentionZero } from '$lib/schema/person-note-mention';
	import { adjustMentionsForTrimmedNote } from '$lib/utils/person-note/mentions';
	import { untrack } from 'svelte';

	let {
		note,
		editOpen = $bindable(true),
		onNotesChanged
	}: {
		note: ReadPersonNoteWithUserZero;
		editOpen: boolean;
		onNotesChanged?: () => void;
	} = $props();
	import { toast } from 'svelte-sonner';

	let mentions = $state<WritePersonNoteMentionZero[]>(
		untrack(() =>
			note.mentions.map(({ id, mentionedUserId, startIndex, length }) => ({
				id,
				mentionedUserId,
				startIndex,
				length
			}))
		)
	);

	const { form, data } = createForm({
		schema: updatePersonNoteZero,
		initialData: {
			note: (() => note.note ?? '')()
		},
		onSubmit: async (data) => {
			try {
				const parsed = parse(updateMutatorSchemaZero, {
					input: {
						note: data.note,
						mentions: adjustMentionsForTrimmedNote(currentNote, data.note, mentions)
					},
					metadata: {
						personId: note.personId,
						userId: appState.userId,
						organizationId: appState.organizationId,
						personNoteId: note.id
					}
				});
				await z.mutate(mutators.personNote.update(parsed)).server;
				onNotesChanged?.();
				toast.success(t`Note updated`);
				editOpen = false;
			} catch {
				toast.error(t`Failed to update note`);
			}
		}
	});
	let currentNote = $derived($data.note ?? '');
</script>

<form use:form.enhance>
	<Form.Field name="note" {form}>
		<Form.Control>
			{#snippet children({ props })}
				<InputGroup.Root>
					<MentionTextarea
						{...props}
						placeholder={t`Edit note...`}
						bind:value={$data.note}
						bind:mentions
						onkeydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
								e.preventDefault();
								form.submit();
							}
						}}
					/>
					<InputGroup.Addon align="block-end">
						<InputGroup.Text class="ms-auto"
							><span class:text-destructive={($data.note?.length ?? 0) > MEDIUM_STRING_MAX_LENGTH}
								>{$data.note?.length ?? 0}/{MEDIUM_STRING_MAX_LENGTH}</span
							></InputGroup.Text
						>
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex justify-end gap-2">
		<Button variant="outline" type="button" size="sm" onclick={() => (editOpen = false)}
			>{t`Cancel`}</Button
		>
		<Button variant="default" type="submit" size="sm">
			<ArrowUpIcon />
			{t`Update note`}
		</Button>
	</div>
</form>
