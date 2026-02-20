<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { type ReadTeamZero, updateTeam } from '$lib/schema/team';
	import createForm from '$lib/form.svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { appState } from '$lib/state.svelte';

	let { team }: { team: ReadTeamZero } = $props();

	let { form, data, errors, Errors, helpers } = createForm({
		schema: updateTeam,
		/* svelte-ignore state_referenced_locally */
		initialData: {
			name: team.name,
			parentTeamId: team.parentTeamId,
			deletedAt: team.deletedAt ?? null
		},
		onSubmit: async (data) => {
			z.mutate(
				mutators.team.update({
					metadata: {
						organizationId: appState.organizationId,
						teamId: team.id
					},
					input: {
						...data,
						deletedAt:
							data.deletedAt != null
								? typeof data.deletedAt === 'number'
									? data.deletedAt
									: (data.deletedAt as Date).getTime()
								: null
					}
				})
			);
			isOpen = false;
		}
	});
	let isOpen = $state(false);
</script>

<ResponsiveModal title={t`Edit Team`} description={t`Update the team name.`} bind:open={isOpen}>
	{#snippet trigger()}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon-sm">
					<PencilIcon class="size-4" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>{t`Edit team`}</Tooltip.Content>
		</Tooltip.Root>
	{/snippet}
	{#snippet children()}
		<form use:form.enhance class="space-y-4">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Name`}</Form.Label>
						<Input type="text" bind:value={$data.name} placeholder={t`e.g., Sales team`} />
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
