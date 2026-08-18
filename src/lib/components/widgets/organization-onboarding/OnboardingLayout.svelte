<script lang="ts">
	import { type Snippet } from 'svelte';
	import { t } from '$lib/index.svelte';
	import GradientBorder from '$lib/components/widgets/GradientBorder.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import logo from '$lib/assets/logo.png';

	/**
	 * The bounded shell for the onboarding "product": its own minimal top bar
	 * (brand + org identity + quiet exit) and a focused, distraction-free frame.
	 * No app sidebar or nav — onboarding feels apart from the app while reusing
	 * the app's tokens and components so it still feels part of it.
	 */
	let {
		orgName,
		orgIcon,
		exitHref = '/dashboard',
		exitLabel = t`Skip for now`,
		showExit = true,
		children
	}: {
		orgName?: string;
		orgIcon?: string;
		exitHref?: string;
		exitLabel?: string;
		showExit?: boolean;
		children: Snippet;
	} = $props();

	const orgInitial = $derived((orgName ?? '').trim().charAt(0).toUpperCase() || 'B');
</script>

<div class="flex min-h-svh flex-col bg-muted">
	<header
		class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6"
	>
		<a href="/dashboard" class="flex items-center gap-2 font-medium">
			<GradientBorder class="size-6 rounded-[0.2rem]">
				<div
					class="flex size-6 items-center justify-center rounded-[calc(0.2rem-1px)] bg-primary text-primary-foreground"
				>
					<img src={logo} alt={t`Belcoda logo`} class="h-full w-full object-contain" />
				</div>
			</GradientBorder>
			<span>Belcoda</span>
		</a>

		<div class="flex items-center gap-3">
			{#if orgName}
				<div class="flex items-center gap-2">
					<Avatar.Root class="size-6">
						{#if orgIcon}
							<Avatar.Image src={orgIcon} alt={orgName} />
						{/if}
						<Avatar.Fallback class="text-xs">{orgInitial}</Avatar.Fallback>
					</Avatar.Root>
					<span class="hidden text-sm text-muted-foreground sm:inline">{orgName}</span>
				</div>
			{/if}
			{#if showExit}
				<Button href={exitHref} variant="ghost" size="sm" class="text-muted-foreground">
					{exitLabel}
				</Button>
			{/if}
		</div>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
		{@render children?.()}
	</main>
</div>
