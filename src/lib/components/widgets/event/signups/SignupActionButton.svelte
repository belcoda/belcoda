<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { type ReadEventZero } from '$lib/schema/event';

	let { signup, event }: { signup: ReadEventSignupZeroWithPerson; event: ReadEventZero } = $props();

	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';

	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	import { handleUpdateStatus } from './actions';
	import ViewDetailedSignup from './ViewDetailedSignup.svelte';
	let openDetailedSignup = $state(false);
</script>

<ViewDetailedSignup {signup} {event} bind:open={openDetailedSignup} />
<ButtonGroup.Root class="flex w-full items-center justify-end">
	{#if signup.status === 'attended'}
		<Button
			variant="outline"
			size="sm"
			onclick={() =>
				handleUpdateStatus({
					eventSignupId: signup.id,
					organizationId: appState.organizationId,
					personId: signup.personId,
					eventId: signup.eventId,
					status: 'signup'
				})}><CheckIcon class="text-green-500" /> Attended</Button
		>
	{:else if signup.status === 'noshow'}
		<Button
			variant="outline"
			size="sm"
			onclick={() =>
				handleUpdateStatus({
					eventSignupId: signup.id,
					organizationId: appState.organizationId,
					personId: signup.personId,
					eventId: signup.eventId,
					status: 'signup'
				})}><XIcon class="text-red-500" /> No show</Button
		>
	{:else if signup.status === 'notattending'}
		<Button
			variant="outline"
			size="sm"
			onclick={() =>
				handleUpdateStatus({
					eventSignupId: signup.id,
					organizationId: appState.organizationId,
					personId: signup.personId,
					eventId: signup.eventId,
					status: 'signup'
				})}><XIcon class="text-red-500" /> Not attending</Button
		>
	{:else if signup.status === 'signup'}
		<Button
			variant="outline"
			size="sm"
			onclick={() =>
				handleUpdateStatus({
					eventSignupId: signup.id,
					organizationId: appState.organizationId,
					personId: signup.personId,
					eventId: signup.eventId,
					status: 'attended'
				})}><CheckIcon class="text-green-500" /> Attended</Button
		>
		<Button
			variant="outline"
			size="sm"
			onclick={() =>
				handleUpdateStatus({
					eventSignupId: signup.id,
					organizationId: appState.organizationId,
					personId: signup.personId,
					eventId: signup.eventId,
					status: 'noshow'
				})}><XIcon class="text-red-500" /> No show</Button
		>
	{/if}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon-sm' })}>
			<ChevronDownIcon />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Item
				onclick={() =>
					handleUpdateStatus({
						eventSignupId: signup.id,
						organizationId: appState.organizationId,
						personId: signup.personId,
						eventId: signup.eventId,
						status: 'attended'
					})}>Mark as attended</DropdownMenu.Item
			>
			<DropdownMenu.Item
				onclick={() =>
					handleUpdateStatus({
						eventSignupId: signup.id,
						organizationId: appState.organizationId,
						personId: signup.personId,
						eventId: signup.eventId,
						status: 'noshow'
					})}>Mark as no show</DropdownMenu.Item
			>
			<DropdownMenu.Item
				onclick={() =>
					handleUpdateStatus({
						eventSignupId: signup.id,
						organizationId: appState.organizationId,
						personId: signup.personId,
						eventId: signup.eventId,
						status: 'notattending'
					})}>Cancel signup</DropdownMenu.Item
			>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={() => (openDetailedSignup = true)}
				>View detailed signup</DropdownMenu.Item
			>
			<DropdownMenu.Separator />
			{#if signup.person.phoneNumber || signup.person.emailAddress}
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>Quick contact</DropdownMenu.GroupHeading>
					{#if signup.person.phoneNumber}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={`https://wa.me/${signup.person.phoneNumber}`} target="_blank" {...props}
									>WhatsApp <span class="icon-[lucide--external-link]"></span></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{/if}
					{#if signup.person.phoneNumber}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={`tel:${signup.person.phoneNumber}`} target="_blank" {...props}
									>Phone <span class="icon-[lucide--external-link]"></span></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{/if}
					{#if signup.person.emailAddress}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={`mailto:${signup.person.emailAddress}`} target="_blank" {...props}
									>Email <span class="icon-[lucide--external-link]"></span></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Group>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>
