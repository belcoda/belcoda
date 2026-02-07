<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { personSchema, type ReadPersonZero } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { optional, objectAsync } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();
	import { t } from '$lib/index.svelte';

	const schema = objectAsync({
		addressLine1: optional(personSchema.entries.addressLine1),
		addressLine2: optional(personSchema.entries.addressLine2),
		locality: optional(personSchema.entries.locality),
		region: optional(personSchema.entries.region),
		postcode: optional(personSchema.entries.postcode),
		country: personSchema.entries.country
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			addressLine1: person.addressLine1,
			addressLine2: person.addressLine2,
			locality: person.locality,
			region: person.region,
			postcode: person.postcode,
			country: person.country
		},
		onSubmit: async (data) => {
			const response = z.mutate.person.update({
				metadata: {
					organizationId: appState.organizationId,
					personId: person.id
				},
				input: {
					addressLine1: data.addressLine1,
					addressLine2: data.addressLine2,
					locality: data.locality,
					region: data.region,
					postcode: data.postcode,
					country: data.country
				}
			});
			try {
				await response.server;
				edit = false;
			} catch (error) {
				toast.error(t`Could not update address. Please check that the address is valid.`);
			}
		}
	});
	import { Input } from '$lib/components/ui/input/index.js';
	import CountrySelect from '$lib/components/ui/custom-select/country/country.svelte';
</script>

<form use:form.enhance>
	<Form.Field {form} name="addressLine1">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder="Address line 1"
					{...props}
					bind:value={$data.addressLine1 as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="addressLine2">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder="Address line 2 (optional)"
					{...props}
					bind:value={$data.addressLine2 as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="locality">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder="City/town"
					{...props}
					bind:value={$data.locality as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="region">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder="Region/state"
					{...props}
					bind:value={$data.region as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="postcode">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder="Postcode"
					{...props}
					bind:value={$data.postcode as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="country">
		<Form.Control>
			{#snippet children({ props })}
				<CountrySelect bind:value={$data.country as string} {...props} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="mt-3 flex items-center justify-end gap-2">
		<Button type="button" size="sm" variant="outline" onclick={() => (edit = false)}>{t`Cancel`}</Button>
		<Button type="submit" size="sm">{t`Save`}</Button>
	</div>
	<Debug {data} />
</form>
