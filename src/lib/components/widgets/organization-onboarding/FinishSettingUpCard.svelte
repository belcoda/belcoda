<script lang="ts">
	import { t } from '$lib/index.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import type { OnboardingTask } from './types';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	function defaultTasks(): OnboardingTask[] {
		return [
			{ id: 'org', title: t`Organization created`, track: 'now', status: 'done' },
			{
				id: 'profile',
				title: t`Set your time zone & language`,
				description: t`So dates and messages behave correctly`,
				hint: t`30 sec`,
				track: 'now',
				status: 'done'
			},
			{
				id: 'team',
				title: t`Create your first team`,
				description: t`Where your organisers live`,
				hint: t`30 sec`,
				track: 'now',
				status: 'active',
				actionLabel: t`Create`,
				action: 'team'
			},
			{
				id: 'people',
				title: t`Add your first people`,
				description: t`or import a list`,
				track: 'later',
				status: 'todo',
				action: 'people'
			},
			{
				id: 'invite',
				title: t`Invite teammates`,
				badge: t`optional`,
				track: 'later',
				status: 'todo',
				action: 'invite'
			},
			{
				id: 'whatsapp',
				title: t`Connect WhatsApp`,
				badge: t`has ban risk`,
				track: 'later',
				status: 'todo',
				action: 'whatsapp',
				href: '/setup/whatsapp'
			}
		];
	}

	let {
		tasks = defaultTasks(),
		canInvite = true,
		onaction
	}: {
		tasks?: OnboardingTask[];
		canInvite?: boolean;
		onaction?: (action: string) => void;
	} = $props();

	// Members cannot invite teammates, so drop that task for them entirely.
	const visibleTasks = $derived(
		canInvite ? tasks : tasks.filter((task) => task.action !== 'invite')
	);

	const doneCount = $derived(visibleTasks.filter((task) => task.status === 'done').length);
	const percent = $derived(
		visibleTasks.length ? Math.round((doneCount / visibleTasks.length) * 100) : 0
	);
	const nowTasks = $derived(visibleTasks.filter((task) => task.track === 'now'));
	const laterTasks = $derived(visibleTasks.filter((task) => task.track === 'later'));

	function runAction(task: OnboardingTask) {
		if (task.action) onaction?.(task.action);
	}
</script>

<Card.Root>
	<Card.Header class="gap-3">
		<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
			<Card.Title class="text-base">{t`Finish setting up`}</Card.Title>
			<span class="text-sm text-muted-foreground">
				{t`${String(doneCount)} of ${String(visibleTasks.length)} done`} — {t`you can do the rest anytime`}
			</span>
		</div>
		<div class="flex items-center gap-3">
			<Progress value={percent} class="h-2" />
			<span class="text-xs font-medium text-muted-foreground">{percent}%</span>
		</div>
	</Card.Header>

	<Card.Content class="flex flex-col gap-5">
		<section class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{t`Due now`}
			</h3>
			{#each nowTasks as task (task.id)}
				<div class="flex items-center gap-3 rounded-lg border p-3">
					<span
						class="flex size-5 shrink-0 items-center justify-center rounded-full border {task.status ===
						'done'
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-primary text-primary'}"
					>
						{#if task.status === 'done'}
							<CheckIcon class="size-3" />
						{:else}
							<span class="size-1.5 rounded-full bg-primary"></span>
						{/if}
					</span>
					<div class="flex min-w-0 flex-1 flex-col">
						<span
							class="text-sm font-medium {task.status === 'done' ? 'text-muted-foreground' : ''}"
						>
							{task.title}
						</span>
						{#if task.description}
							<span class="text-xs text-muted-foreground">
								{task.description}{#if task.hint}<span class="ml-1">· {task.hint}</span>{/if}
							</span>
						{/if}
					</div>
					{#if task.status !== 'done' && task.actionLabel}
						<Button size="sm" class="shrink-0" onclick={() => runAction(task)}>
							{task.actionLabel}
						</Button>
					{/if}
				</div>
			{/each}
		</section>

		<section class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{t`Eventually`}
			</h3>
			{#each laterTasks as task (task.id)}
				<button
					type="button"
					onclick={() => runAction(task)}
					class="flex items-center gap-2 rounded-lg px-1 py-2 text-left hover:bg-muted"
				>
					<span class="text-sm">{task.title}</span>
					{#if task.badge}
						<Badge variant="secondary" class="font-normal">{task.badge}</Badge>
					{/if}
					<ChevronRightIcon class="ml-auto size-4 text-muted-foreground" />
				</button>
			{/each}
		</section>
	</Card.Content>
</Card.Root>
