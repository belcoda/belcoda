<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { authClient } from '$lib/auth-client';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	type Props = {
		memberId: string;
		userName: string;
		isSelf: boolean;
	};
	let { memberId, userName, isSelf }: Props = $props();

	let isOpen = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	function open() {
		error = null;
		isOpen = true;
	}

	function close() {
		if (!submitting) {
			isOpen = false;
			error = null;
		}
	}

	async function handleRemove() {
		if (isSelf) {
			toast.error(t`You cannot remove yourself from the organization`);
			return;
		}

		try {
			submitting = true;
			error = null;
			const result = await authClient.organization.removeMember({
				memberIdOrEmail: memberId,
				organizationId: appState.organizationId
			});

			if (result.error) {
				throw new Error(result.error.message || t`Failed to remove member`);
			}

			toast.success(t`${userName} has been removed from the organization`);
			isOpen = false;
		} catch (e: any) {
			error = e.message || t`Failed to remove member`;
			console.error('Error removing member:', e);
		} finally {
			submitting = false;
		}
	}
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		<Button variant="ghost" size="icon-sm" onclick={open} class="text-destructive hover:text-destructive">
			<TrashIcon class="size-4" />
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>{t`Remove member`}</Tooltip.Content>
</Tooltip.Root>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{t`Remove Member`}</Dialog.Title>
			<Dialog.Description>
				{t`Are you sure you want to remove ${userName} from this organization? They will lose access to all organization resources immediately.`}
			</Dialog.Description>
		</Dialog.Header>

		{#if error}
			<Alert.Root variant="destructive" class="mt-4">
				<AlertCircleIcon />
				<Alert.Title>{t`Error`}</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		<Dialog.Footer>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={close} disabled={submitting}>
					{t`Cancel`}
				</Button>
				<Button variant="destructive" onclick={handleRemove} disabled={submitting}>
					{#if submitting}
						<Spinner class="mr-2 h-4 w-4" />
						{t`Removing...`}
					{:else}
						<TrashIcon class="mr-2 h-4 w-4" />
						{t`Remove`}
					{/if}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
