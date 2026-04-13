<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { appState } from '$lib/state.svelte';
	import { type ReadPersonZero, personSchema } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { objectAsync, optional } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { toast } from 'svelte-sonner';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();
	import { t } from '$lib/index.svelte';

	const schema = objectAsync({
		givenName: optional(personSchema.entries.givenName),
		familyName: optional(personSchema.entries.familyName)
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			/* svelte-ignore state_referenced_locally */
			givenName: person.givenName,
			/* svelte-ignore state_referenced_locally */
			familyName: person.familyName
		},
		onSubmit: async (data) => {
			const response = z.mutate(
				mutators.person.update({
					metadata: {
						organizationId: appState.organizationId,
						personId: person.id
					},
					input: {
						givenName: data.givenName,
						familyName: data.familyName
					}
				})
			);
			try {
				await response.server;
				edit = false;
			} catch (error) {
				toast.error(
					t`Could not update email address. Please check that the email address does not belong to another person.`
				);
			}
		}
	});
	import { Input } from '$lib/components/ui/input/index.js';
</script>

<form use:form.enhance>
	<Form.Field {form} name="givenName">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder={t`Given name`}
					data-testid="person-profile-given-name"
					{...props}
					bind:value={$data.givenName as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="familyName">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder={t`Family name`}
					data-testid="person-profile-family-name"
					{...props}
					bind:value={$data.familyName as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="mt-3 flex items-center justify-end gap-2">
		<Button type="button" size="sm" variant="outline" onclick={() => (edit = false)}
			>{t`Cancel`}</Button
		>
		<Button type="submit" size="sm" data-testid="person-profile-name-save">{t`Save`}</Button>
	</div>
	<Debug {data} />
</form>
