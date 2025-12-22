<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import { MEDIUM_STRING_MAX_LENGTH } from '$lib/schema/helpers';
	import { z } from '$lib/zero.svelte';
	import { createMutatorSchemaZero, createPersonNoteZero } from '$lib/schema/person-note';
	import { appState } from '$lib/state.svelte';

	import { v7 as uuidv7 } from 'uuid';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';

	const { personId }: { personId: string } = $props();
	const { form, data, errors, Errors, helpers } = createForm({
		schema: createPersonNoteZero,
		onSubmit: async (data) => {
			const parsed = parse(createMutatorSchemaZero, {
				input: {
					note: data.note
				},
				metadata: {
					personId: personId,
					userId: appState.userId,
					organizationId: appState.organizationId,
					personNoteId: uuidv7()
				}
			});
			const input = z.mutate.personNote.create(parsed);
			form.reset();
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
						placeholder="Add a note or comment..."
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
						<Separator orientation="vertical" class="h-4!" />
						<InputGroup.Button variant="default" type="submit"
							><ArrowUpIcon /> Add note</InputGroup.Button
						>
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
</form>
