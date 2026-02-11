<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { type Snippet } from 'svelte';
	let {
		duration = 1500,
		disabled = false,
		onComplete = () => {},
		children
	}: {
		duration?: number;
		disabled?: boolean;
		onComplete: () => void | Promise<void>;
		children: Snippet;
	} = $props();

	let pressing = $state(false);
	let progress = $state(0); // 0 → 1
	let startTime = 0;
	let raf = 0;

	function start() {
		if (disabled || pressing) return;
		pressing = true;
		startTime = performance.now();
		raf = requestAnimationFrame(tick);
	}

	function cancel() {
		pressing = false;
		progress = 0;
		cancelAnimationFrame(raf);
	}

	function tick(now: number) {
		if (!pressing) return;

		const elapsed = now - startTime;
		progress = Math.min(elapsed / duration, 1);

		if (progress === 1) {
			// visual fill is now complete
			onComplete?.();
			cancel();
			return;
		}

		raf = requestAnimationFrame(tick);
	}
</script>

<button
	type="button"
	{disabled}
	onpointerdown={(e) => {
		e.preventDefault();
		start();
	}}
	onpointerup={(e) => {
		e.preventDefault();
		cancel();
	}}
	onpointerleave={(e) => {
		e.preventDefault();
		cancel();
	}}
	onpointercancel={(e) => {
		e.preventDefault();
		cancel();
	}}
	class={cn(
		buttonVariants({ size: 'sm', variant: 'outline' }),
		'hover:text-destructive-foreground active:text-destructive-foreground relative inline-flex items-center justify-center overflow-hidden rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
	)}
>
	<!-- progress fill -->
	<span
		class="pointer-events-none absolute inset-0 bg-destructive/20"
		style="width: {progress * 100}%"
	></span>

	<!-- label -->
	<span class="relative z-10">
		{@render children?.()}
	</span>
</button>
