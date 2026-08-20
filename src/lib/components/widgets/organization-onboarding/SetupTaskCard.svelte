<script lang="ts">
	import { type Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { BadgeVariant } from '$lib/components/ui/badge/index.js';

	let {
		title,
		description,
		badge,
		badgeVariant = 'secondary',
		actionLabel,
		actionHref,
		onAction,
		icon,
		children
	}: {
		title: string;
		description?: string;
		badge?: string;
		badgeVariant?: BadgeVariant;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
		icon?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<Card.Root class="gap-0">
	<Card.Header class="gap-0">
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-start gap-3">
				{#if icon}
					<span
						class="mt-0.5 flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground"
					>
						{@render icon()}
					</span>
				{/if}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<Card.Title class="text-base">{title}</Card.Title>
						{#if badge}
							<Badge variant={badgeVariant} class="font-normal">{badge}</Badge>
						{/if}
					</div>
					{#if description}
						<Card.Description>{description}</Card.Description>
					{/if}
				</div>
			</div>

			{#if actionLabel && !children}
				{#if actionHref}
					<Button href={actionHref} variant="outline" size="sm" class="shrink-0"
						>{actionLabel}</Button
					>
				{:else}
					<Button onclick={onAction} variant="outline" size="sm" class="shrink-0"
						>{actionLabel}</Button
					>
				{/if}
			{/if}
		</div>
	</Card.Header>

	{#if children}
		<Card.Content class="pt-4">
			{@render children()}
		</Card.Content>
	{/if}
</Card.Root>
