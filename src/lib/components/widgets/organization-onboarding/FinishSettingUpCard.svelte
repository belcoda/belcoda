<script lang="ts">
	import { t } from '$lib/index.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ReadOrganizationZero } from '$lib/schema/organization';
	import type { OrganizationOnboardingSettingsSchema } from '$lib/schema/organization/settings';
	import { getListFilter } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import queries from '$lib/zero/query';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { snapshotOrganizationSettings } from '$lib/utils/organization-onboarding';

	type DashboardTask = {
		id: 'profile' | 'team' | 'people' | 'invitations' | 'whatsappAccount';
		title: string;
		description: string;
		action: string;
		canBeNotNeeded?: boolean;
	};

	type Organization = Pick<ReadOrganizationZero, 'id' | 'settings'>;

	let {
		organization,
		canInvite = true,
		onaction
	}: {
		organization: Organization;
		canInvite?: boolean;
		onaction?: (action: string) => void;
	} = $props();

	let deferredTaskId = $state<string | null>(null);
	let updatingTaskId = $state<string | null>(null);
	let error = $state<string | null>(null);
	const people = $derived.by(() =>
		z.createQuery(queries.person.list(getListFilter(organization.id, { pageSize: 1 })))
	);

	const allTasks = $derived.by((): DashboardTask[] => [
		{
			id: 'profile',
			title: t`Review organization defaults`,
			description: t`Confirm your time zone and language`,
			action: 'profile'
		},
		{
			id: 'team',
			title: t`Create your first team`,
			description: t`Organize the people who work together`,
			action: 'team',
			canBeNotNeeded: true
		},
		{
			id: 'people',
			title: t`Add your first people`,
			description: t`Add one person or import a list`,
			action: 'people'
		},
		{
			id: 'invitations',
			title: t`Invite teammates`,
			description: t`Bring other organizers into Belcoda`,
			action: 'invite',
			canBeNotNeeded: true
		},
		{
			id: 'whatsappAccount',
			title: t`Connect WhatsApp`,
			description: t`Send updates and receive replies from your community`,
			action: 'whatsapp',
			canBeNotNeeded: true
		}
	]);

	function taskStatus(
		task: DashboardTask
	): OrganizationOnboardingSettingsSchema[DashboardTask['id']] | undefined {
		if (task.id === 'people' && people.data?.length) return 'complete';
		return organization.settings.onboarding?.[task.id];
	}

	const visibleTasks = $derived(
		allTasks.filter(
			(task) => (canInvite || task.id !== 'invitations') && taskStatus(task) !== 'not_needed'
		)
	);
	const completedTasks = $derived(visibleTasks.filter((task) => taskStatus(task) === 'complete'));
	const outstandingTasks = $derived(visibleTasks.filter((task) => taskStatus(task) !== 'complete'));
	const nextTask = $derived(
		outstandingTasks.find((task) => task.id !== deferredTaskId) ?? outstandingTasks[0]
	);
	const otherTasks = $derived(outstandingTasks.filter((task) => task.id !== nextTask?.id));

	function runAction(task: DashboardTask) {
		error = null;
		onaction?.(task.action);
	}

	async function markNotNeeded(task: DashboardTask) {
		updatingTaskId = task.id;
		error = null;
		try {
			const result = await z.mutate(
				mutators.organization.updateOnboarding({
					metadata: {
						organizationId: organization.id,
						existingSettings: snapshotOrganizationSettings(organization.settings)
					},
					input: { [task.id]: 'not_needed' }
				})
			).server;
			if (result.type === 'error') throw new Error(result.error.message);
		} catch (caught) {
			error = caught instanceof Error ? caught.message : t`Unable to save that choice`;
		} finally {
			updatingTaskId = null;
		}
	}
</script>

{#if organization.settings.onboarding && outstandingTasks.length}
	<Card.Root>
		<Card.Header class="gap-1">
			<Card.Title class="text-base">{t`Keep building your workspace`}</Card.Title>
			<Card.Description>{t`Start with one small step. The rest can wait.`}</Card.Description>
		</Card.Header>

		<Card.Content class="flex flex-col gap-4">
			{#if nextTask}
				<div class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">{nextTask.title}</p>
						<p class="mt-0.5 text-sm text-muted-foreground">{nextTask.description}</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<Button size="sm" onclick={() => runAction(nextTask)}>{t`Continue`}</Button>
						{#if nextTask.canBeNotNeeded}
							<Button
								variant="ghost"
								size="sm"
								disabled={updatingTaskId === nextTask.id}
								onclick={() => markNotNeeded(nextTask)}
							>
								{t`Not needed`}
							</Button>
						{/if}
						{#if otherTasks.length}
							<Button variant="ghost" size="sm" onclick={() => (deferredTaskId = nextTask.id)}>
								{t`Later`}
							</Button>
						{/if}
					</div>
				</div>
			{/if}

			{#if otherTasks.length}
				<details class="group">
					<summary
						class="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						{t`More setup suggestions (${String(otherTasks.length)})`}
					</summary>
					<div class="mt-2 flex flex-col divide-y rounded-lg border px-3">
						{#each otherTasks as task (task.id)}
							<div class="flex items-center gap-2 py-3">
								<button
									type="button"
									class="min-w-0 flex-1 text-left"
									onclick={() => runAction(task)}
								>
									<p class="text-sm font-medium">{task.title}</p>
									<p class="text-xs text-muted-foreground">{task.description}</p>
								</button>
								{#if task.canBeNotNeeded}
									<Button
										variant="ghost"
										size="sm"
										disabled={updatingTaskId === task.id}
										onclick={() => markNotNeeded(task)}
									>
										{t`Not needed`}
									</Button>
								{/if}
								<ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
							</div>
						{/each}
					</div>
				</details>
			{/if}

			{#if completedTasks.length}
				<details class="group">
					<summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
						{t`${String(completedTasks.length)} setup task${completedTasks.length === 1 ? '' : 's'} complete`}
					</summary>
					<div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
						{#each completedTasks as task (task.id)}
							<span class="inline-flex items-center gap-1"
								><CheckIcon class="size-3 text-primary" />{task.title}</span
							>
						{/each}
					</div>
				</details>
			{/if}

			{#if error}
				<p class="text-sm text-destructive" role="alert">{error}</p>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
