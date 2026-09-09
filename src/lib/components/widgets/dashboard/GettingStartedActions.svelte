<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { t } from '$lib/index.svelte';
	import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	const actions = $derived([
		{
			title: t`Add people`,
			description: t`Keep contact details, notes, and activity in one place.`,
			href: '/community/person/new',
			icon: UserPlusIcon
		},
		{
			title: t`Create an event`,
			description: t`Publish an event and manage signups from one place.`,
			href: '/events/new',
			icon: CalendarPlusIcon
		},
		{
			title: t`Start a petition`,
			description: t`Collect support and add signers to your community.`,
			href: '/petitions/new',
			icon: MegaphoneIcon
		}
	]);
</script>

<Card.Root>
	<Card.Header class="gap-1">
		<Card.Title class="text-base">{t`What would you like to do first?`}</Card.Title>
		<Card.Description
			>{t`Choose one starting point. You can explore everything else later.`}</Card.Description
		>
	</Card.Header>
	<Card.Content class="grid gap-3 md:grid-cols-3">
		{#each actions as action (action.href)}
			<a
				href={action.href}
				class="group flex items-start gap-3 rounded-lg border p-4 no-underline transition-colors hover:bg-muted/50"
			>
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
				>
					<action.icon class="size-4" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="block text-sm font-medium">{action.title}</span>
					<span class="mt-1 block text-xs leading-relaxed text-muted-foreground">
						{action.description}
					</span>
				</span>
				<ChevronRightIcon
					class="mt-2.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
				/>
			</a>
		{/each}
	</Card.Content>
</Card.Root>
