<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { type ReadPersonZero, personSchema } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { objectAsync } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';

	import { email } from '$lib/schema/helpers';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();
	import { t } from '$lib/index.svelte';

	const schema = objectAsync({
		workplace: personSchema.entries.workplace,
		position: personSchema.entries.position
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			workplace: person.workplace,
			position: person.position
		},
		onSubmit: async (data) => {
			const response = z.mutate.person.update({
				metadata: {
					organizationId: appState.organizationId,
					personId: person.id
				},
				input: {
					workplace: data.workplace,
					position: data.position
				}
			});
			try {
				await response.server;
				edit = false;
			} catch (error) {
				toast.error(t`Could not update workplace or position. Please try again.`);
			}
		}
	});
	import { Input } from '$lib/components/ui/input/index.js';
</script>

<form use:form.enhance>
	<Form.Field {form} name="workplace">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder={t`Workplace`}
					{...props}
					bind:value={$data.workplace as string}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="position">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="text"
					placeholder={t`Position`}
					{...props}
					bind:value={$data.position as string}
				/>
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
