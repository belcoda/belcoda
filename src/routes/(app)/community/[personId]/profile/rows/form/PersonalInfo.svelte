<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { appState } from '$lib/state.svelte';
	import { type ReadPersonZero, personSchema } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { objectAsync } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';
	import { date } from '$lib/schema/helpers';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();

	const schema = objectAsync({
		gender: personSchema.entries.gender,
		dateOfBirth: date
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			gender: person.gender,
			dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth) : null
		},
		onSubmit: async (data) => {
			const response = z.mutate.person.update({
				metadata: {
					organizationId: appState.organizationId,
					personId: person.id
				},
				input: {
					gender: data.gender,
					// @ts-expect-error - the mutator expects date that gets transformed to a timestamp, so it will work if we just pass a timestamp
					dateOfBirth: data.dateOfBirth ? data.dateOfBirth.getTime() : null
				}
			});
			try {
				await response.server;
				edit = false;
			} catch (error) {
				toast.error('Could not update personal information. Please try again.');
			}
		}
	});
	import { Input } from '$lib/components/ui/input/index.js';
	import Gender from '$lib/components/ui/custom-select/gender/gender.svelte';
	import type { GenderOption } from '$lib/utils/person';
	import { dateToInputValue, inputValueToDate } from '$lib/utils/date';

	let dateOfBirth = $state(
		person.dateOfBirth ? dateToInputValue(new Date(person.dateOfBirth)) : null
	);

	function getDateOfBirth() {
		return dateOfBirth ?? '';
	}
	function setDateOfBirth(dateString: string) {
		dateOfBirth = dateString;
		const parsedDate = inputValueToDate(dateString);
		if (parsedDate) {
			$data.dateOfBirth = parsedDate;
		}
	}
</script>

<form use:form.enhance>
	<Form.Field {form} name="gender">
		<Form.Control>
			{#snippet children({ props })}
				<Gender {...props} bind:value={$data.gender as GenderOption} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="dateOfBirth">
		<Form.Control>
			{#snippet children({ props })}
				<Input type="date" {...props} bind:value={getDateOfBirth, setDateOfBirth} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="mt-3 flex items-center justify-end gap-2">
		<Button type="button" size="sm" variant="outline" onclick={() => (edit = false)}>Cancel</Button>
		<Button type="submit" size="sm">Save</Button>
	</div>
	<Debug {data} />
</form>
