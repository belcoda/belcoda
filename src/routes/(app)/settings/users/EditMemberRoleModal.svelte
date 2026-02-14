<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { authClient } from '$lib/auth-client';
	import { appState } from '$lib/state.svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import PencilIcon from '@lucide/svelte/icons/pencil';

	type Props = {
		memberId: string;
		userName: string;
		currentRole: string;
	};
	let { memberId, userName, currentRole }: Props = $props();

	let isOpen = $state(false);
	/* svelte-ignore state_referenced_locally */
	let selectedRole = $state<'member' | 'admin' | 'owner'>(currentRole as 'member' | 'admin' | 'owner');
	let submitting = $state(false);

	const ROLES = [
		{ value: 'member', label: () => t`Member` },
		{ value: 'admin', label: () => t`Admin` },
		{ value: 'owner', label: () => t`Owner` }
	];

	function getRoleLabel(value: string): string {
		return ROLES.find((r) => r.value === value)?.label() ?? value;
	}

	// Reset selected role when modal opens
	$effect(() => {
		if (isOpen) {
			selectedRole = currentRole as 'member' | 'admin' | 'owner';
		}
	});

	async function handleUpdateRole() {
		if (selectedRole === currentRole) {
			isOpen = false;
			return;
		}

		try {
			submitting = true;
			const result = await authClient.organization.updateMemberRole({
				memberId: memberId,
				role: selectedRole,
				organizationId: appState.organizationId
			});

			if (result.error) {
				throw new Error(result.error.message || t`Failed to update role`);
			}

			toast.success(t`Role updated for ${userName}`);
			isOpen = false;
		} catch (e: any) {
			toast.error(e.message || t`Failed to update role`);
			console.error('Error updating member role:', e);
		} finally {
			submitting = false;
		}
	}
</script>

<ResponsiveModal
	title={t`Edit Role`}
	description={t`Change the role for ${userName}.`}
	bind:open={isOpen}
>
	{#snippet trigger()}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon-sm">
					<PencilIcon class="size-4" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>{t`Edit role`}</Tooltip.Content>
		</Tooltip.Root>
	{/snippet}
	{#snippet children()}
		<div class="space-y-4">
			<div class="space-y-2">
				<Label>{t`Role`}</Label>
				<Select.Root type="single" bind:value={selectedRole}>
					<Select.Trigger class="w-full">
						{getRoleLabel(selectedRole)}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each ROLES as r (r.value)}
								<Select.Item value={r.value} label={r.label()}>
									{r.label()}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="outline" onclick={() => (isOpen = false)} disabled={submitting}>
				{t`Cancel`}
			</Button>
			<Button onclick={handleUpdateRole} disabled={submitting}>
				{#if submitting}
					<Spinner class="mr-2 h-4 w-4" />
					{t`Saving...`}
				{:else}
					{t`Save changes`}
				{/if}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
