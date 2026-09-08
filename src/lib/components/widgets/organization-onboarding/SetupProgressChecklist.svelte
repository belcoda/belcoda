<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { cn } from '$lib/utils.js';
	import type { SetupStep } from './types';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		steps,
		title = t`Your progress`,
		compact = false,
		class: className
	}: {
		steps: SetupStep[];
		title?: string;
		compact?: boolean;
		class?: string;
	} = $props();

	const doneCount = $derived(steps.filter((s) => s.status === 'done').length);
	const summary = $derived(t`${String(doneCount)} of ${String(steps.length)} done`);
</script>

{#if compact}
	<div
		class={cn(
			'flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm',
			className
		)}
	>
		<span class="font-medium">{summary}</span>
		<span class="text-muted-foreground">· {t`saved as you go`}</span>
	</div>
{:else}
	<aside class={cn('rounded-xl border bg-background p-4', className)}>
		<div class="flex items-baseline justify-between gap-2">
			<h2 class="text-sm font-medium">{title}</h2>
			<span class="text-xs text-muted-foreground">{summary}</span>
		</div>

		<ol class="mt-4 flex flex-col gap-3">
			{#each steps as step (step.id)}
				<li class="flex items-start gap-3">
					<span
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
						</span>
						{#if step.meta}
							<span class="text-xs text-muted-foreground">{step.meta}</span>
						{/if}
					</span>
				</li>
			{/each}
		</ol>
	</aside>
{/if}
