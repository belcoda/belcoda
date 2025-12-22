<script lang="ts">
	const { eventId }: { eventId: string } = $props();
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEventSignups, type ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import { v7 as uuidv7 } from 'uuid';
	let filter: ListEventSignupsInput = $state({
		...getListFilter(appState.organizationId),
		eventId
	});
	const eventSignups = $derived.by(() => {
		return z.createQuery(listEventSignups(appState.queryContext, filter));
	});
	import { listActionCodes } from '$lib/zero/query/action_code/list';
	const actionCodes = $derived.by(() => {
		return z.createQuery(
			listActionCodes(appState.queryContext, {
				organizationId: appState.organizationId,
				referenceId: eventId
			})
		);
	});
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Badge from '$lib/components/ui/badge/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';

	function handleAddPerson(personIds: string[]) {
		personIds.forEach((personId) => {
			z.mutate.eventSignup.create({
				input: {
					eventId,
					personId,
					details: {
						channel: {
							type: 'eventPage'
						}
					},
					status: 'signup'
				},
				metadata: {
					eventSignupId: uuidv7(),
					organizationId: appState.organizationId,
					eventId,
					personId
				}
			});
		});
	}
</script>

<Card.Root>
	{#if eventSignups.details.type === 'complete' && eventSignups.data && eventSignups.data.length > 0}
		<Card.Header>
			<Card.Title class="flex items-center justify-between"
				>Signups ({eventSignups.data.length})
				<AddPersonModal
					trigger={addPersonTrigger}
					personIdsToExclude={eventSignups.data.map((signup) => signup.personId)}
					onSelected={(personIds) => {
						handleAddPerson(personIds);
					}}
				/>
			</Card.Title>
		</Card.Header>
		{#snippet addPersonTrigger()}<Button>Add Person</Button>{/snippet}

		<Card.Content>
			<Table.Root>
				<Table.Caption>A list of your recent invoices.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head></Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-end">Signup location</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each eventSignups.data as signup}
						<Table.Row>
							<Table.Cell class="font-medium">{signup.personId}</Table.Cell>
							<Table.Cell>{signup.status}</Table.Cell>
							<Table.Cell class="text-end">{signup.details.channel.type}</Table.Cell>
						</Table.Row>
					{/each}
					{#each actionCodes.data as actionCode}
						<Table.Row>
							<Table.Cell>{actionCode.id}</Table.Cell>
							<Table.Cell>{actionCode.type}</Table.Cell>
							<Table.Cell>{actionCode.createdAt}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	{:else if eventSignups.details.type === 'complete' && (!eventSignups.data || eventSignups.data.length === 0)}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<UserPlusIcon />
				</Empty.Media>
				<Empty.Title>No signups found</Empty.Title>
				<Empty.Description>No signups found. Create a new signup to get started.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<div class="flex gap-2">
					<AddPersonModal
						trigger={emptyAddPersonTrigger}
						personIdsToExclude={[]}
						onSelected={handleAddPerson}
					/>
					{#snippet emptyAddPersonTrigger()}<Button>Add Person</Button>{/snippet}
				</div>
			</Empty.Content>
		</Empty.Root>
	{:else if eventSignups.details.type === 'unknown'}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
</Card.Root>
