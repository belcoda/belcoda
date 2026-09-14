<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { cn } from '$lib/utils.js';
	import type { SetupStep } from './types';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		steps,
		title = t`Setup overview`,
		compact = false,
		class: className
	}: {
		steps: SetupStep[];
		title?: string;
		compact?: boolean;
		class?: string;
	} = $props();

	const basics = $derived(steps.filter((step) => !step.optional));
	const optionalSteps = $derived(steps.filter((step) => step.optional));
	const doneCount = $derived(basics.filter((step) => step.status === 'done').length);
	const summary = $derived(
		doneCount === basics.length
			? t`Basics confirmed`
			: t`${String(doneCount)} of ${String(basics.length)} basics confirmed`
	);
</script>

{#if compact}
	<details class={cn('rounded-xl border bg-background p-4', className)}>
		<summary class="cursor-pointer text-sm font-medium">{summary}</summary>
		<div class="mt-4">{@render checklist()}</div>
	</details>
{:else}
	<aside class={cn('rounded-xl border bg-background p-4', className)}>
		<h2 class="text-sm font-medium">{title}</h2>
		<p class="mt-1 text-xs text-muted-foreground">{summary}</p>
		<div class="mt-4">{@render checklist()}</div>
	</aside>
{/if}

{#snippet checklist()}
	<section>
		<h3 class="text-xs font-medium text-muted-foreground">{t`Getting started`}</h3>
		{@render stepList(basics)}
	</section>
	{#if optionalSteps.length}
		<section class="mt-5 border-t pt-4">
			<h3 class="text-xs font-medium text-muted-foreground">
				{t`Optional — whenever you're ready`}
			</h3>
			{@render stepList(optionalSteps)}
		</section>
	{/if}
{/snippet}

{#snippet stepList(items: SetupStep[])}
	<ol class="mt-3 flex flex-col gap-3">
		{#each items as step (step.id)}
			<li class="flex items-start gap-3">
				<span
					aria-hidden="true"
					class={cn(
						'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
						step.status === 'done' && 'border-primary bg-primary text-primary-foreground',
						step.status === 'active' && 'border-primary text-primary',
						step.status === 'todo' && 'border-muted-foreground/30 text-muted-foreground'
					)}
				>
					{#if step.status === 'done'}
						<CheckIcon class="size-3" />
					{:else if step.status === 'active'}
						<span class="size-1.5 rounded-full bg-primary"></span>
					{/if}
				</span>
				<span class="flex flex-col gap-0.5">
					<span
						class={cn(
							'text-sm leading-tight',
							step.status === 'todo' && 'text-muted-foreground',
							step.status === 'active' && 'font-medium'
						)}
					>
						{step.label}
						{#if step.status === 'done'}<span class="sr-only"> — {t`Completed`}</span>{/if}
					</span>
					{#if step.meta}
						<span class="text-xs text-muted-foreground">{step.meta}</span>
					{/if}
				</span>
			</li>
		{/each}
	</ol>
{/snippet}
