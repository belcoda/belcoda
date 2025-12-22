<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { appState } from '$lib/state.svelte';
	import type { ReadPersonZero } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { objectAsync, optional } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';

	import { phoneNumber } from '$lib/schema/helpers';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();
	let valid = $state(false);
	const schema = objectAsync({
		phoneNumber: optional(phoneNumber)
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			phoneNumber: person.phoneNumber || undefined
		},
		onSubmit: async (data) => {
			const response = z.mutate.person.update({
				metadata: {
					organizationId: appState.organizationId,
					personId: person.id
				},
				input: {
					phoneNumber: data.phoneNumber
				}
			});
			try {
				await response.server;
				edit = false;
			} catch (error) {
				toast.error(
					'Could not update phone number. Please check that the phone number is valid and does not belong to another person.'
				);
			}
		}
	});
	import PhoneNumberSelect from '$lib/components/ui/custom-select/phone-number/phone-number.svelte';
	import type { CountryCode } from '$lib/schema/helpers';
</script>

<form use:form.enhance>
	<Form.Field {form} name="phoneNumber">
		<Form.Control>
			{#snippet children({ props })}
				<PhoneNumberSelect
					bind:valid
					country={person.country as CountryCode}
					bind:value={$data.phoneNumber}
					{...props}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="mt-3 flex items-center justify-end gap-2">
		<Button type="button" size="sm" variant="outline" onclick={() => (edit = false)}>Cancel</Button>
		<Button type="submit" size="sm" disabled={!valid}>Save</Button>
	</div>
	<Debug {data} />
</form>
