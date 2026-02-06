<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import { MEDIUM_STRING_MAX_LENGTH } from '$lib/schema/helpers';
	import { z } from '$lib/zero.svelte';
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

	let {
		note,
		editOpen = $bindable(true)
	}: { note: ReadPersonNoteWithUserZero; editOpen: boolean } = $props();
	console.log(note);
	import { toast } from 'svelte-sonner';
	const { form, data, errors, Errors, helpers } = createForm({
		schema: updatePersonNoteZero,
		initialData: {
			note: note.note
		},
		onSubmit: async (data) => {
			const parsed = parse(updateMutatorSchemaZero, {
				input: {
					note: data.note
				},
				metadata: {
					personId: note.personId,
					userId: appState.userId,
					organizationId: appState.organizationId,
					personNoteId: note.id
				}
			});
			const input = z.mutate.personNote.update(parsed);
			toast.success('Note updated');
			editOpen = false;
		}
	});
</script>

<form use:form.enhance>
	<Form.Field name="note" {form}>
		<Form.Control>
			{#snippet children({ props })}
				<InputGroup.Root>
					<InputGroup.Textarea
						{...props}
						placeholder={t`Edit note...`}
						bind:value={$data.note}
						onkeydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
								e.preventDefault();
								form.submit();
							}
						}}
					/>
					<InputGroup.Addon align="block-end">
						<InputGroup.Text class="ms-auto"
							><span class:text-destructive={$data.note.length > MEDIUM_STRING_MAX_LENGTH}
								>{$data.note.length}/{MEDIUM_STRING_MAX_LENGTH}</span
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
				<ArrowUpIcon /> {t`Update note`}
			</Button>
		</div>
</form>
