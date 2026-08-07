<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import { MEDIUM_STRING_MAX_LENGTH } from '$lib/schema/helpers';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { createMutatorSchemaZero, createPersonNoteZero } from '$lib/schema/person-note';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';

	import { v7 as uuidv7 } from 'uuid';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';

	type Props = {
		personId: string;
		/** Used for the accessible label so the field says which conversation it belongs to. */
		personDisplayName?: string;
		autofocus?: boolean;
		onSaved?: () => void;
	};

	const { personId, personDisplayName, autofocus = false, onSaved }: Props = $props();

	/**
	 * Single place where the note text becomes mutator arguments. Mentions will add a
	 * `mentionedUserIds` field here and nowhere else in this component.
	 */
	function buildCreateNoteArgs(note: string) {
		return parse(createMutatorSchemaZero, {
			input: {
				note
			},
			metadata: {
				personId: personId,
				userId: appState.userId,
				organizationId: appState.organizationId,
				personNoteId: uuidv7()
			}
		});
	}

	const { form, data } = createForm({
		schema: createPersonNoteZero,
		initialData: {
			note: ''
		},
		validateOnLoad: false,
		onSubmit: async (data) => {
			z.mutate(mutators.personNote.create(buildCreateNoteArgs(data.note)));
			onSaved?.();
			form.reset();
		}
	});

	const noteLength = $derived(($data.note ?? '').length);
</script>

<form use:form.enhance class="w-full">
	<Form.Field name="note" {form}>
		<Form.Control>
			{#snippet children({ props })}
				<InputGroup.Root class="border-amber-300 bg-amber-50 focus-within:border-amber-500">
					<InputGroup.Textarea
						{...props}
						{autofocus}
						placeholder={t`Write an internal note...`}
						aria-label={personDisplayName
							? t`Internal note about ${personDisplayName}`
							: t`Internal note`}
						class="text-amber-950 placeholder:text-amber-700/60"
						bind:value={$data.note}
						data-testid="note-form-textarea"
						onkeydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
								e.preventDefault();
								form.submit();
							}
						}}
					/>
					<InputGroup.Addon align="block-end" class="border-amber-200">
						<InputGroup.Text class="ms-auto"
							><span
								class={noteLength > MEDIUM_STRING_MAX_LENGTH
									? 'text-destructive'
									: 'text-amber-700/80'}>{noteLength}/{MEDIUM_STRING_MAX_LENGTH}</span
							></InputGroup.Text
						>
						<Separator orientation="vertical" class="h-4! bg-amber-200" />
						<InputGroup.Button
							variant="default"
							type="submit"
							class="bg-amber-600 text-white hover:bg-amber-700"
							data-testid="note-form-submit"><ArrowUpIcon /> {t`Save note`}</InputGroup.Button
						>
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
</form>
