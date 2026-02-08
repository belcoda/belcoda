<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { appState } from '$lib/state.svelte';
	import type { ReadPersonZero } from '$lib/schema/person';
	import { Button } from '$lib/components/ui/button/index.js';
	import { objectAsync } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';

	import { email } from '$lib/schema/helpers';

	let { person, edit = $bindable(true) }: { person: ReadPersonZero; edit: boolean } = $props();
	import { t } from '$lib/index.svelte';

	const schema = objectAsync({
		emailAddress: email
	});

	const { form, data, errors, Errors, Debug } = createForm({
		schema,
		initialData: {
			emailAddress: person.emailAddress
		},
		onSubmit: async (data) => {
			const response = z.mutate.person.update({
				metadata: {
					organizationId: appState.organizationId,
					personId: person.id
				},
				input: {
					emailAddress: data.emailAddress
				}
			});
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
	<Form.Field {form} name="emailAddress">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					type="email"
					placeholder={t`email@example.com`}
					{...props}
					bind:value={$data.emailAddress as string}
				/>
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
