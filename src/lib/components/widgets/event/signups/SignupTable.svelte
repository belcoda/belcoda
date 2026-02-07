<script lang="ts">
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();

	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { type ReadEventZero } from '$lib/schema/event';
	import { t } from '$lib/index.svelte';
	let {
		signups,
		event,
		selectedSignups = $bindable([]),
		queryIsCompleted
	}: {
		signups: ReadEventSignupZeroWithPerson[];
		event: ReadEventZero;
		selectedSignups: ReadEventSignupZeroWithPerson[];
		queryIsCompleted: boolean;
	} = $props();

	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	import SignupTableRow from './SignupTableRow.svelte';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';

	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	import { handleAddPerson, handleUpdateStatus } from './actions';

	const signupCountLabel = (count: number) => {
		return t`${count.toString()} signups`;
	};
</script>

{#if queryIsCompleted && signups.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UserPlusIcon />
			</Empty.Media>
			<Empty.Title>{t`No signups found`}</Empty.Title>
			<Empty.Description
				>{t`No signups found. Create a new signup to get started.`}</Empty.Description
			>
		</Empty.Header>
		<Empty.Content>
			<div class="flex gap-2">
				<AddPersonModal
					trigger={emptyAddPersonTrigger}
					personIdsToExclude={[]}
					onSelected={(personIds) => {
						handleAddPerson({ eventId: event.id, personIds });
					}}
				/>
				{#snippet emptyAddPersonTrigger()}<Button>{t`Add Person`}</Button>{/snippet}
			</div>
		</Empty.Content>
	</Empty.Root>
{:else}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={selectedSignups.length === signups.length}
							onCheckedChange={(checked) => {
								if (checked) {
									selectedSignups = signups;
								} else {
									selectedSignups = [];
								}
							}}
						/>
						{#if selectedSignups.length > 0}
							{t`Signups`} ({signupCountLabel(selectedSignups.length)}/{signupCountLabel(
								signups.length
							)})
						{:else}
							{t`Signups`} ({signups.length})
						{/if}
					</div>
				</Table.Head>
				<Table.Head>{t`Status`}</Table.Head>
				<Table.Head class="text-end">{t`Actions`}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each signups as signup}
				<SignupTableRow {signup} {event} bind:selectedSignups />
			{/each}
			{#if !queryIsCompleted}
				{@render personSkeleton()}
				{@render personSkeleton()}
				{@render personSkeleton()}
			{/if}
		</Table.Body>
	</Table.Root>
	{@render actionButtons()}
{/if}

{#snippet personSkeleton()}
	<Table.Row>
		<Table.Cell class="flex items-center gap-2">
			<Skeleton class="size-12 rounded-full" />
			<div class="space-y-2">
				<Skeleton class="h-4 w-[250px]" />
				<Skeleton class="h-4 w-[200px]" />
			</div>
		</Table.Cell>
		<Table.Cell>
			<Skeleton class="h-4 w-[200px]" />
		</Table.Cell>
		<Table.Cell class="text-end">
			<div class="flex justify-end"><Skeleton class="h-4 w-[100px]" /></div>
		</Table.Cell>
	</Table.Row>
{/snippet}

{#snippet actionButtons()}
	<div class="mt-4 flex justify-end gap-2">
		<Button
			variant="outline"
			size="sm"
			disabled={selectedSignups.length === 0}
			onclick={() => {
				selectedSignups.forEach((signup) => {
					handleUpdateStatus({
						eventSignupId: signup.id,
						organizationId: appState.organizationId,
						personId: signup.personId,
						eventId: event.id,
						status: 'attended'
					});
				});
				selectedSignups = [];
			}}
		>
			<CheckIcon class="text-green-700" />{t`Mark as attended`}
		</Button>
		<Button
			variant="outline"
			size="sm"
			disabled={selectedSignups.length === 0}
			onclick={() => {
				selectedSignups.forEach((signup) => {
					handleUpdateStatus({
						eventSignupId: signup.id,
						organizationId: appState.organizationId,
						personId: signup.personId,
						eventId: event.id,
						status: 'noshow'
					});
				});
				selectedSignups = [];
			}}><XIcon class="text-red-700" />{t`Mark as no show`}</Button
		>
	</div>
{/snippet}
