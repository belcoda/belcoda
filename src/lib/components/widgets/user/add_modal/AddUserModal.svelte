<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { type Snippet } from 'svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { t } from '$lib/index.svelte';

	type UserDisplay = { id: string; name: string; email: string };
	import XIcon from '@lucide/svelte/icons/x';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	type Props = {
		trigger: Snippet;
		userIdsToExclude: string[];
		onSelected: (userIds: string[]) => void;
	};
	let { trigger, userIdsToExclude = [], onSelected }: Props = $props();

	let isOpen = $state(false);
	let selectedUserIds = $state<string[]>([]);
	let selectedUsers = $state<UserDisplay[]>([]);

	const usersFilter = $derived({
		...getListFilter(appState.organizationId),
		teamId: null,
		excludedIds: userIdsToExclude
	});
	const usersQuery = $derived.by(() => z.createQuery(queries.user.list(usersFilter)));

	const availableUsers = $derived(
		(usersQuery.data ?? []).filter((u) => !selectedUserIds.includes(u.id))
	);
</script>

<ResponsiveModal
	title={t`Add User`}
	description={t`Select organization members to add to the team.`}
	{trigger}
	bind:open={isOpen}
>
	<div class="space-y-2">
		<ScrollArea class="h-[200px] w-full rounded-md border">
			{#if usersQuery.details.type === 'error'}
				<div class="py-4 text-center text-muted-foreground">{t`Error loading users.`}</div>
			{:else if usersQuery.details.type === 'unknown'}
				<div class="flex items-center space-x-4 p-4">
					<Skeleton class="size-10 rounded-full" />
					<div class="space-y-2">
						<Skeleton class="h-4 w-[200px]" />
						<Skeleton class="h-4 w-[160px]" />
					</div>
				</div>
			{:else if availableUsers.length === 0}
				<div class="py-8 text-center text-muted-foreground">
					{t`No users available to add.`}
				</div>
			{:else}
				{#each availableUsers as user (user.id)}
					<div class="border-b border-b-accent/70 px-2 py-1.5 last:border-b-0 hover:bg-accent/70">
						<label for={`user-${user.id}`} class="flex cursor-pointer items-center gap-2">
							<Checkbox
								class="ms-2.5"
								checked={selectedUserIds.includes(user.id)}
								id={`user-${user.id}`}
								onCheckedChange={(checked) => {
									if (checked) {
										selectedUserIds = [user.id, ...selectedUserIds];
										selectedUsers = [
											{ id: user.id, name: user.name, email: user.email },
											...selectedUsers
										];
									} else {
										selectedUserIds = selectedUserIds.filter((id) => id !== user.id);
										selectedUsers = selectedUsers.filter((u) => u.id !== user.id);
									}
								}}
							/>
							<div class="flex flex-col py-1">
								<div class="text-sm font-medium">{user.name}</div>
								<div class="text-xs text-muted-foreground">{user.email}</div>
							</div>
						</label>
					</div>
				{/each}
			{/if}
		</ScrollArea>
		{#if selectedUsers.length > 0}
			<div class="mt-2 -mb-1 font-medium">{t`Selected`} ({selectedUsers.length})</div>
			<ScrollArea class="h-[150px] w-full rounded-md border">
				{#each selectedUsers as user (user.id)}
					<div
						class="flex items-center justify-between gap-2 border-b border-b-accent/70 py-1.5 ps-4 pe-2 last:border-b-0 hover:bg-accent/70"
					>
						<div class="flex flex-col py-0.5">
							<div class="text-sm font-medium">{user.name}</div>
							<div class="text-xs text-muted-foreground">{user.email}</div>
						</div>
						<Button
							variant="ghost"
							class="text-muted-foreground"
							size="sm"
							onclick={() => {
								selectedUserIds = selectedUserIds.filter((id) => id !== user.id);
								selectedUsers = selectedUsers.filter((u) => u.id !== user.id);
							}}
						>
							<XIcon />
						</Button>
					</div>
				{/each}
			</ScrollArea>
		{/if}
		<div class="flex items-center justify-end gap-2 pt-2">
			<Button variant="outline" onclick={() => (isOpen = false)}>{t`Close`}</Button>
			<Button
				disabled={selectedUserIds.length === 0}
				onclick={() => {
					onSelected(selectedUserIds);
					isOpen = false;
				}}
			>
				{t`Add to team`} ({selectedUserIds.length})
			</Button>
		</div>
	</div>
</ResponsiveModal>
