<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { appState } from '$lib/state.svelte';
	import { type ReadPersonZero, personSchema } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { objectAsync } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { toast } from 'svelte-sonner';
	import { unixTimestamp } from '$lib/schema/helpers';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();
	import { t } from '$lib/index.svelte';

	const schema = objectAsync({
		gender: personSchema.entries.gender,
		dateOfBirth: unixTimestamp
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			/* svelte-ignore state_referenced_locally */
			gender: person.gender,
			/* svelte-ignore state_referenced_locally */
			dateOfBirth: person.dateOfBirth ?? null
		},
		onSubmit: async (data) => {
			const response = z.mutate(
				mutators.person.update({
					metadata: {
						organizationId: appState.organizationId,
						personId: person.id
					},
					input: {
						gender: data.gender,
						dateOfBirth: data.dateOfBirth ?? null
					}
				})
			);
			try {
				await response.server;
				edit = false;
			} catch (error) {
				toast.error(t`Could not update personal information. Please try again.`);
			}
		}
	});
	import InputDate from '$lib/components/ui/custom-input/date.svelte';
	import Gender from '$lib/components/ui/custom-select/gender/gender.svelte';
	import type { GenderOption } from '$lib/utils/person';
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
				<InputDate {...props} bind:value={$data.dateOfBirth} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="mt-3 flex items-center justify-end gap-2">
		<Button type="button" size="sm" variant="outline" onclick={() => (edit = false)}
			>{t`Cancel`}</Button
		>
		<Button type="submit" size="sm">{t`Save`}</Button>
	</div>
	<Debug {data} />
</form>
