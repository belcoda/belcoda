<script lang="ts">
	import { type Snippet } from 'svelte';
	import { t } from '$lib/index.svelte';
	const {
		link,
		title,
		description,
		children,
		footer
	}: {
		link: string;
		title: string;
		description: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
	import GradientBorder from '$lib/components/widgets/GradientBorder.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import logo from '$lib/assets/logo.png';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href={link} class="flex items-center gap-2 self-center font-medium">
			<GradientBorder class="size-6 rounded-[0.2rem]">
				<div
					class="flex size-6 items-center justify-center rounded-[calc(0.2rem-1px)] bg-primary text-primary-foreground"
				>
					<img src={logo} alt={t`logo`} class="h-full w-full object-contain" />
				</div>
			</GradientBorder>
			Belcoda
		</a>
		<div>
			<Card.Root>
				<Card.Header class="text-center">
					<Card.Title class="text-xl">{title}</Card.Title>
					<Card.Description>{description}</Card.Description>
				</Card.Header>
				<Card.Content>
					{@render children?.()}
				</Card.Content>
			</Card.Root>
			{#if footer}
				<div class="mt-6">{@render footer?.()}</div>
			{/if}
		</div>
	</div>
</div>
