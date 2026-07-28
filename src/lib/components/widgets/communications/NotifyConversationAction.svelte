<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { toast } from 'svelte-sonner';
	import { v7 as uuidv7 } from 'uuid';

	import { Button } from '$lib/components/ui/button/index.js';
	import AddUserModal from '$lib/components/widgets/user/add_modal/AddUserModal.svelte';
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { z } from '$lib/zero.svelte';

	const { personId }: { personId: string } = $props();

	async function notifyTeammates(recipientUserIds: string[]) {
		try {
			const recipients = $state.snapshot(recipientUserIds);
			const mutation = z.mutate(
				mutators.notification.notifyConversation({
					input: { recipientUserIds: recipients },
					metadata: {
						organizationId: appState.organizationId,
						personId,
						requestId: uuidv7()
					}
				})
			);
			await mutation.client;
			const serverResult = await mutation.server;
			if (serverResult.type === 'error') {
				throw new Error(serverResult.error.message);
			}
			toast.success(t`Teammates notified`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Unable to notify teammates`);
			throw error;
		}
	}
</script>

<AddUserModal
	userIdsToExclude={[appState.userId]}
	onSelected={notifyTeammates}
	title={t`Bring in teammates`}
	description={t`Select organization members to invite to this conversation.`}
	confirmLabel={t`Notify selected`}
>
	{#snippet trigger()}
		<Button
			variant="ghost"
			size="icon"
			class="sm:w-auto sm:px-3"
			aria-label={t`Bring in teammates`}
			title={t`Bring in teammates`}
			data-testid="notify-conversation-trigger"
		>
			<UserPlusIcon />
			<span class="hidden sm:inline">{t`Bring in teammates`}</span>
		</Button>
	{/snippet}
</AddUserModal>
