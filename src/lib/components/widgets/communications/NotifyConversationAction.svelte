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
			await z.mutate(
				mutators.notification.notifyConversation({
					input: { recipientUserIds },
					metadata: {
						organizationId: appState.organizationId,
						personId,
						requestId: uuidv7()
					}
				})
			);
			toast.success(t`Teammates notified`);
		} catch (error) {
			toast.error(t`Unable to notify teammates`);
			throw error;
		}
	}
</script>

<AddUserModal
	userIdsToExclude={[appState.userId]}
	onSelected={notifyTeammates}
	title={t`Notify teammates`}
	description={t`Select organization members to invite to this conversation.`}
	confirmLabel={t`Notify`}
>
	{#snippet trigger()}
		<Button
			variant="ghost"
			size="icon"
			aria-label={t`Notify teammates`}
			title={t`Notify teammates`}
			data-testid="notify-conversation-trigger"
		>
			<UserPlusIcon />
		</Button>
	{/snippet}
</AddUserModal>
