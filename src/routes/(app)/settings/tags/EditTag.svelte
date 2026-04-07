<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { type ReadTagZero, updateTag } from '$lib/schema/tag';
	import createForm from '$lib/form.svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let { tag }: { tag: ReadTagZero } = $props();

	let { form, data, errors, Errors, helpers } = createForm({
		schema: updateTag,
		/* svelte-ignore state_referenced_locally */
		initialData: tag,
		onSubmit: async (data) => {
			const response = z.mutate(
				mutators.tag.update({
					metadata: {
						organizationId: tag.organizationId,
						tagId: tag.id
					},
					input: data
				})
			);
			isOpen = false;
		}
	});
	let isOpen = $state(false);

	function handleDelete() {
		z.mutate(
			mutators.tag.delete({
				metadata: {
					organizationId: tag.organizationId,
					tagId: tag.id
				}
			})
		);
	}
</script>

<ResponsiveModal
	title={t`Edit Tag`}
	description={t`Update the tag name and status.`}
	bind:open={isOpen}
>
	{#snippet trigger()}
		<div class="flex items-center gap-1">
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="ghost" size="icon-sm">
						<PencilIcon class="size-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>{t`Edit tag`}</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={(e) => {
							e.stopPropagation();
							handleDelete();
						}}
					>
						<TrashIcon class="size-4 text-destructive" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>{t`Delete tag`}</Tooltip.Content>
			</Tooltip.Root>
		</div>
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
			<Form.Field {form} name="active">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center gap-2">
							<Checkbox {...props} bind:checked={$data.active} />
							<Form.Label class="cursor-pointer font-normal">{t`Active`}</Form.Label>
						</div>
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
				{t`Save changes`}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
