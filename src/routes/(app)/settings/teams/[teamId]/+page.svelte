<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
	import AddUserModal from '$lib/components/widgets/user/add_modal/AddUserModal.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { goto } from '$app/navigation';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { page } from '$app/state';

	const teamId = $derived(page.params.teamId ?? '');

	const team = $derived.by(() => z.createQuery(queries.team.read({ teamId })));

	const peopleFilter = $derived({
		...getListFilter(appState.organizationId),
		teamId
	});
	const peopleList = $derived.by(() => z.createQuery(queries.person.list(peopleFilter)));

	const usersFilter = $derived({
		...getListFilter(appState.organizationId),
		teamId
	});
	const usersList = $derived.by(() => z.createQuery(queries.user.list(usersFilter)));

	const personIdsOnTeam = $derived(peopleList.data?.map((p) => p.id) ?? []);
	const userIdsOnTeam = $derived(usersList.data?.map((u) => u.id) ?? []);

	function handleAddPeople(personIds: string[]) {
		for (const personId of personIds) {
			z.mutate(
				mutators.person.addToTeam({
					metadata: {
						organizationId: appState.organizationId,
						teamId,
						personId
					}
				})
			);
		}
	}

	function handleAddUsers(userIds: string[]) {
		for (const userId of userIds) {
			z.mutate(
				mutators.team.addUserToTeam({
					metadata: {
						organizationId: appState.organizationId,
						teamId,
						userId
					}
				})
			);
		}
	}

	function handleRemovePerson(personId: string) {
		z.mutate(
			mutators.person.removeFromTeam({
				metadata: {
					organizationId: appState.organizationId,
					teamId,
					personId
				}
			})
		);
	}

	function handleRemoveUser(userId: string) {
		z.mutate(
			mutators.team.removeUserFromTeam({
				metadata: {
					organizationId: appState.organizationId,
					teamId,
					userId
				}
			})
		);
	}
</script>

<ContentLayout rootLink="/settings/teams" {header}>
	{#if team.details.type === 'complete' && !team.data}
		<div class="py-8 text-center text-muted-foreground">
			{t`Team not found.`}
			<Button variant="link" onclick={() => goto('/settings/teams')}>{t`Back to teams`}</Button>
		</div>
	{:else if team.data}
		<div class="space-y-8">
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<UsersIcon class="size-5" />
						{t`People on this team`}
					</Card.Title>
					<Card.Description>
						{t`Contacts (people) that belong to this team.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{t`Name`}</Table.Head>
								<Table.Head>{t`Email`}</Table.Head>
								<Table.Head>{t`Phone`}</Table.Head>
								<Table.Head class="w-[80px] text-right">{t`Actions`}</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#if peopleList.data && peopleList.data.length === 0}
								<Table.Row>
									<Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
										{t`No people on this team yet.`}
									</Table.Cell>
								</Table.Row>
							{:else if peopleList.data}
								{#each peopleList.data as person (person.id)}
									<Table.Row data-testid="team-person-row" data-person-id={person.id}>
										<Table.Cell class="font-medium">
											<div class="flex items-center gap-2">
												<Avatar
													src={person.profilePicture}
													class="size-6"
													name1={person.givenName || person.familyName || person.emailAddress || ''}
													name2={person.familyName}
												/>
												{person.givenName}
												{person.familyName}
											</div>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground"
											>{person.emailAddress ?? '—'}</Table.Cell
										>
										<Table.Cell class="text-muted-foreground"
											>{person.phoneNumber ?? '—'}</Table.Cell
										>
										<Table.Cell class="text-right">
											<Button
												variant="ghost"
												size="sm"
												data-testid="team-remove-person"
												data-person-id={person.id}
												onclick={() => handleRemovePerson(person.id)}
											>
												{t`Remove`}
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							{:else}
								<Table.Row>
									<Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
										{t`Loading...`}
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
					<div class="mt-4">
						<AddPersonModal
							personIdsToExclude={personIdsOnTeam}
							onSelected={handleAddPeople}
							actionText={t`Add to team`}
						>
							{#snippet trigger()}
								<Button variant="outline" data-testid="team-add-person-trigger"
									><UserPlusIcon class="size-4" /> {t`Add person`}</Button
								>
							{/snippet}
						</AddPersonModal>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<UsersIcon class="size-5" />
						{t`Users on this team`}
					</Card.Title>
					<Card.Description>
						{t`Organization members (users) who have access to this team.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{t`Name`}</Table.Head>
								<Table.Head>{t`Email`}</Table.Head>
								<Table.Head class="w-[80px] text-right">{t`Actions`}</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#if usersList.data && usersList.data.length === 0}
								<Table.Row>
									<Table.Cell colspan={3} class="py-8 text-center text-muted-foreground">
										{t`No users on this team yet.`}
									</Table.Cell>
								</Table.Row>
							{:else if usersList.data}
								{#each usersList.data as user (user.id)}
									<Table.Row>
										<Table.Cell class="font-medium">{user.name}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{user.email}</Table.Cell>
										<Table.Cell class="text-right">
											<Button variant="ghost" size="sm" onclick={() => handleRemoveUser(user.id)}>
												{t`Remove`}
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							{:else}
								<Table.Row>
									<Table.Cell colspan={3} class="py-8 text-center text-muted-foreground">
										{t`Loading...`}
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
					<div class="mt-4">
						<AddUserModal userIdsToExclude={userIdsOnTeam} onSelected={handleAddUsers}>
							{#snippet trigger()}
								<Button variant="outline"><UserPlusIcon class="size-4" /> {t`Add user`}</Button>
							{/snippet}
						</AddUserModal>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{:else}
		<div class="py-8 text-center text-muted-foreground">{t`Loading team...`}</div>
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon-sm" href="/settings/teams" class="shrink-0">
			<ChevronLeftIcon class="size-4" />
		</Button>
		<H2>{team.data?.name ?? t`Team`}</H2>
	</div>
{/snippet}
