<script lang="ts">
	const { eventId }: { eventId: string } = $props();
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEventSignups, type ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import { type ReadEventSignupZero } from '$lib/schema/event-signup';
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
	import { type ReadPersonZero } from '$lib/schema/person';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let selectedPersonIds = $state<string[]>([]);
	function handleAddPerson(personIds: string[]) {
		personIds.forEach((personId) => {
			z.mutate.eventSignup.create({
				input: {
					eventId,
					personId,
					details: {
						channel: {
							type: 'adminPanel'
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

	import { listPersons } from '$lib/zero/query/person/list';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	const personFilter = $state({
		...getListFilter(appState.organizationId),
		signupEventId: eventId
	});
	const persons = $derived.by(() =>
		z.createQuery(listPersons(appState.queryContext, personFilter))
	);

	const getSignUpForPerson = (personId: string) => {
		return eventSignups.data?.find((signup) => signup.personId === personId);
	};

	import { formatShortTimestamp } from '$lib/utils/date';
	import { getLocalTimeZone } from '@internationalized/date';

	function renderSignupChannel(channel: ReadEventSignupZero['details']['channel'], date: number) {
		const formattedDate = formatShortTimestamp(date, appState.locale, getLocalTimeZone());
		switch (channel.type) {
			case 'eventPage':
				return `Signed up via event page (${formattedDate})`;
			case 'adminPanel':
				return `Added manually (${formattedDate})`;
			case 'whatsapp':
				return `Signed up via WhatsApp (${formattedDate})`;
		}
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
				<Table.Header>
					<Table.Row>
						<Table.Head>
							{#if selectedPersonIds.length > 0}
								Signups ({selectedPersonIds.length}/{eventSignups.data.length})
							{:else}
								Signups ({eventSignups.data.length})
							{/if}
						</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-end">Signup location</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each persons.data as person}
						{@const signup = getSignUpForPerson(person.id)}
						{#if signup}
							<Table.Row>
								<Table.Cell>
									{@render personItem(person)}
								</Table.Cell>
								<Table.Cell>
									{@render statusTooltip({ signup, person })}
								</Table.Cell>
								<Table.Cell class="text-end">{signup.details.channel.type}</Table.Cell>
							</Table.Row>
						{/if}
					{/each}
				</Table.Body>
			</Table.Root>
			<div class="mt-4 flex justify-end">
				<Button variant="outline" size="sm" disabled={selectedPersonIds.length === 0}
					>Mark as attended</Button
				>
			</div>
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

{#snippet personItem(person: ReadPersonZero)}
	<div class="border-b border-b-accent/70 px-2 py-1.5 last:border-b-0">
		<label for={`person-${person.id}`} class="flex items-center gap-2">
			<Checkbox
				class="me-2"
				checked={selectedPersonIds.includes(person.id)}
				id={`person-${person.id}`}
				onCheckedChange={(checked) => {
					if (checked) {
						selectedPersonIds = [person.id, ...selectedPersonIds];
					} else {
						selectedPersonIds = selectedPersonIds.filter((p) => p !== person.id);
					}
				}}
			/>
			{@render renderPersonItem(person)}
		</label>
	</div>
{/snippet}

{#snippet renderPersonItem(person: ReadPersonZero)}
	<div class="flex grow items-center gap-2">
		<Avatar
			src={person.profilePicture}
			class="size-6"
			name1={person.givenName || person.familyName || person.emailAddress || ''}
			name2={person.familyName}
		/>
		<div class="flex flex-col">
			<div class="text-sm font-medium">{person.givenName} {person.familyName}</div>
			{#if person.emailAddress || person.phoneNumber}
				<div class="line-clamp-1 max-w-full text-xs text-muted-foreground">
					{person.emailAddress}
					{#if person.phoneNumber && person.emailAddress}{` • `}{/if}
					{person.phoneNumber}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet personSkeleton()}
	<div class="flex items-center space-x-4">
		<Skeleton class="size-12 rounded-full" />
		<div class="space-y-2">
			<Skeleton class="h-4 w-[250px]" />
			<Skeleton class="h-4 w-[200px]" />
		</div>
	</div>
{/snippet}

{#snippet statusTooltip({
	signup,
	person
}: {
	signup: ReadEventSignupZero;
	person: ReadPersonZero;
})}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#if signup.status === 'attended'}
				<Badge variant="default">Attended</Badge>
			{:else if signup.status === 'noshow'}
				<Badge variant="destructive">No show</Badge>
			{:else if signup.status === 'cancelled'}
				<Badge variant="outline">Cancelled</Badge>
			{:else}
				<Badge variant="outline">Signed up</Badge>
			{/if}
		</Tooltip.Trigger>
		<Tooltip.Content
			class="border bg-background text-foreground shadow-md"
			arrowClasses="bg-background text-foreground shadow-md border-r border-b"
		>
			<div>{renderSignupChannel(signup.details.channel, signup.createdAt)}</div>
		</Tooltip.Content>
	</Tooltip.Root>
{/snippet}
