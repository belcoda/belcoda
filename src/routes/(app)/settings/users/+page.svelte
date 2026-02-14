<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { authClient } from '$lib/auth-client';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { formatDate } from '$lib/utils/date';
	import { toast } from 'svelte-sonner';
	import XIcon from '@lucide/svelte/icons/x';
	import InviteUserModal from './InviteUserModal.svelte';
	import EditMemberRoleModal from './EditMemberRoleModal.svelte';
	import RemoveMemberDialog from './RemoveMemberDialog.svelte';

	// Permission check
	const canManage = $derived(appState.isAdminOrOwner);
	const canChangeRoles = $derived(appState.isOwner);

	// Users list from Zero
	let userListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const userList = $derived.by(() => z.createQuery(queries.user.list(userListFilter)));

	// Derive a membership map from the organization's memberships (userId -> { memberId, role })
	const membershipMap = $derived.by(() => {
		const map = new Map<string, { memberId: string; role: string }>();
		const memberships = appState.activeOrganization.data?.memberships;
		if (memberships) {
			for (const m of memberships) {
				map.set(m.userId, { memberId: m.id, role: m.role });
			}
		}
		return map;
	});

	function getUserRole(userId: string): string {
		return membershipMap.get(userId)?.role ?? 'member';
	}

	function getMemberId(userId: string): string {
		return membershipMap.get(userId)?.memberId ?? '';
	}

	function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
		switch (role) {
			case 'owner':
				return 'default';
			case 'admin':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getRoleLabel(role: string): string {
		switch (role) {
			case 'owner':
				return t`Owner`;
			case 'admin':
				return t`Admin`;
			default:
				return t`Member`;
		}
	}

	// Invitations from better-auth
	let invitations = $state<any[]>([]);
	let invitationsLoading = $state(true);

	async function loadInvitations() {
		try {
			invitationsLoading = true;
			const result = await authClient.organization.listInvitations({
				query: {
					organizationId: appState.organizationId
				}
			});
			if (result.error) {
				console.error('Error loading invitations:', result.error);
				invitations = [];
			} else {
				// Filter to only show pending invitations
				invitations = (result.data || []).filter(
					(inv: any) => inv.status === 'pending'
				);
			}
		} catch (e) {
			console.error('Error loading invitations:', e);
			invitations = [];
		} finally {
			invitationsLoading = false;
		}
	}

	async function handleCancelInvitation(invitationId: string) {
		try {
			const result = await authClient.organization.cancelInvitation({
				invitationId
			});
			if (result.error) {
				throw new Error(result.error.message || t`Failed to cancel invitation`);
			}
			toast.success(t`Invitation cancelled`);
			await loadInvitations();
		} catch (e: any) {
			toast.error(e.message || t`Failed to cancel invitation`);
			console.error('Error cancelling invitation:', e);
		}
	}

	// Load invitations on mount
	$effect(() => {
		if (canManage) {
			loadInvitations();
		}
	});
</script>

{#if !canManage}
	<ContentLayout rootLink="/settings">
		<Card.Root>
			<Card.Content>
				<p>
					{t`You don't have permission to manage users. Only admins and owners can access this page.`}
				</p>
			</Card.Content>
		</Card.Root>
	</ContentLayout>
{:else}
	<ContentLayout rootLink="/settings" {header}>
		<div class="space-y-6">
			<!-- Members Table -->
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Members`}</Card.Title>
					<Card.Description>
						{t`Users who are part of this organization.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{t`Name`}</Table.Head>
								<Table.Head>{t`Email`}</Table.Head>
								<Table.Head>{t`Role`}</Table.Head>
								<Table.Head>{t`Joined`}</Table.Head>
								{#if canChangeRoles}
									<Table.Head class="w-[100px] text-right">{t`Actions`}</Table.Head>
								{/if}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#if userList.data && userList.data.length === 0}
								<Table.Row>
									<Table.Cell colspan={canChangeRoles ? 5 : 4} class="py-12 text-center text-muted-foreground">
										{t`No members found.`}
									</Table.Cell>
								</Table.Row>
							{:else if userList.data}
								{#each userList.data as user (user.id)}
									{@const role = getUserRole(user.id)}
									<Table.Row>
										<Table.Cell class="font-medium">{user.name}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{user.email}</Table.Cell>
										<Table.Cell>
											<Badge variant={getRoleBadgeVariant(role)}>
												{getRoleLabel(role)}
											</Badge>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground">
											{formatDate(user.createdAt)}
										</Table.Cell>
										{#if canChangeRoles}
											<Table.Cell class="text-right">
												{#if user.id !== appState.userId}
													<div class="flex items-center justify-end gap-1">
														<EditMemberRoleModal
															memberId={getMemberId(user.id)}
															userName={user.name}
															currentRole={role}
														/>
														<RemoveMemberDialog
															memberId={getMemberId(user.id)}
															userName={user.name}
															isSelf={user.id === appState.userId}
														/>
													</div>
												{/if}
											</Table.Cell>
										{/if}
									</Table.Row>
								{/each}
							{:else}
								<Table.Row>
									<Table.Cell colspan={canChangeRoles ? 5 : 4} class="py-8 text-center text-muted-foreground">
										{t`Loading members...`}
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>

			<!-- Pending Invitations -->
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Pending Invitations`}</Card.Title>
					<Card.Description>
						{t`Invitations that have been sent but not yet accepted.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if invitationsLoading}
						<div class="flex items-center justify-center py-8">
							<Spinner />
						</div>
					{:else if invitations.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							{t`No pending invitations.`}
						</p>
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>{t`Email`}</Table.Head>
									<Table.Head>{t`Role`}</Table.Head>
									<Table.Head>{t`Sent`}</Table.Head>
									<Table.Head class="w-[80px] text-right">{t`Actions`}</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each invitations as invitation (invitation.id)}
									<Table.Row>
										<Table.Cell class="font-medium">{invitation.email}</Table.Cell>
										<Table.Cell>
											<Badge variant={getRoleBadgeVariant(invitation.role)}>
												{getRoleLabel(invitation.role)}
											</Badge>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground">
											{formatDate(new Date(invitation.createdAt).getTime())}
										</Table.Cell>
										<Table.Cell class="text-right">
											<Button
												variant="ghost"
												size="icon-sm"
												onclick={() => handleCancelInvitation(invitation.id)}
												class="text-destructive hover:text-destructive"
											>
												<XIcon class="size-4" />
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</ContentLayout>

	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>{t`Users`}</H2>
			<InviteUserModal onInvited={loadInvitations} />
		</div>
	{/snippet}
{/if}
