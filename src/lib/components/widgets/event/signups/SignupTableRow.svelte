<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { type ReadEventZero } from '$lib/schema/event';
	let {
		signup,
		event,
		selectedSignups = $bindable()
	}: {
		signup: ReadEventSignupZeroWithPerson;
		event: ReadEventZero;
		selectedSignups: ReadEventSignupZeroWithPerson[];
	} = $props();

	import { renderSignupChannel } from './actions';

	import SignupActionButton from './SignupActionButton.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
</script>

<Table.Row>
	<Table.Cell>
		{@render personItem(signup)}
	</Table.Cell>
	<Table.Cell>
		{#if signup.status === 'attended'}
			<Badge variant="default">Attended</Badge>
		{:else if signup.status === 'noshow'}
			<Badge variant="destructive">No show</Badge>
		{:else if signup.status === 'notattending'}
			<Badge variant="secondary" class="opacity-70">Not attending</Badge>
		{:else}
			<Badge variant="outline">Signed up</Badge>
		{/if}
	</Table.Cell>
	<Table.Cell class="text-end">
		<SignupActionButton {signup} {event} />
	</Table.Cell>
</Table.Row>

{#snippet personItem(signup: ReadEventSignupZeroWithPerson)}
	<div class="border-b border-b-accent/70 px-2 py-1.5 last:border-b-0">
		<label for={`person-${signup.personId}`} class="flex items-center gap-2">
			<Checkbox
				class="me-2"
				id={`person-${signup.personId}`}
				checked={selectedSignups.includes(signup)}
				onCheckedChange={() => {
					if (selectedSignups.includes(signup)) {
						selectedSignups = selectedSignups.filter((s) => s.id !== signup.id);
					} else {
						selectedSignups = [...selectedSignups, signup];
					}
				}}
			/>
			<div class="flex grow items-center gap-2" class:opacity-70={signup.status === 'notattending'}>
				<Avatar
					src={signup.person.profilePicture}
					class="size-6"
					name1={signup.person.givenName ||
						signup.person.familyName ||
						signup.person.emailAddress ||
						''}
					name2={signup.person.familyName}
				/>
				<div class="flex flex-col">
					<div class="text-sm font-medium">
						{signup.person.givenName}
						{signup.person.familyName}
					</div>
					<div class="line-clamp-1 max-w-full text-xs text-muted-foreground">
						{renderSignupChannel({
							channel: signup.details.channel,
							event,
							date: signup.createdAt
						})}
					</div>
				</div>
			</div>
		</label>
	</div>
{/snippet}
