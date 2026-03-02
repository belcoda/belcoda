<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { createTag } from '$lib/schema/tag';
	import createForm from '$lib/form.svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { appState } from '$lib/state.svelte';
	import { v7 as uuidv7 } from 'uuid';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { form, data, errors, Errors, helpers } = createForm({
		schema: createTag,
		onSubmit: async (data) => {
			const response = z.mutate(
				mutators.tag.create({
					metadata: {
						organizationId: appState.organizationId,
						tagId: uuidv7()
					},
					input: data
				})
			);
			isOpen = false;
		}
	});
	let isOpen = $state(false);
</script>

<ResponsiveModal
	title={t`New Tag`}
	description={t`Create a new tag for organizing your contacts.`}
	bind:open={isOpen}
>
	{#snippet trigger()}
		<Button variant="outline"><PlusIcon /> {t`New`}</Button>
	{/snippet}
	{#snippet children()}
		<form use:form.enhance class="space-y-4">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Name`}</Form.Label>
						<Input
							type="text"
							bind:value={$data.name}
							placeholder={t`e.g., Newsletter subscribers`}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</form>
	{/snippet}
	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="outline" onclick={() => (isOpen = false)}>{t`Cancel`}</Button>
			<Button
				onclick={() => {
					form.submit();
				}}
			>
				{t`Create`}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
