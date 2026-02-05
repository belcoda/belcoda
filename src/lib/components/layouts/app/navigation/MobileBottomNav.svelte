<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	const navClass = cn(
		buttonVariants({ variant: 'ghost', size: 'default' }),
		'h-full w-full justify-center rounded-none'
	);
</script>

<div class="bg-neutral-primary-soft border-default h-full w-full border-t">
	<div class="mx-auto grid h-full max-w-lg grid-cols-4 font-medium">
		<a href="/community" class={navClass}>
			<div class="text-center">
				<div class="icon-[lucide--users] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">Community</div>
			</div>
		</a>
		<a href="/communications" class={navClass}>
			<div class="text-center">
				<div class="icon-[flowbite--messages-outline] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">Communications</div>
			</div>
		</a>
		<a href="/events" class={navClass}>
			<div class="text-center">
				<div class="icon-[mdi--events] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">Events</div>
			</div>
		</a>
		<a href="/petitions" class={navClass}>
			<div class="text-center">
				<div class="icon-[mage--zap] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">Petitions</div>
			</div>
		</a>
	</div>
</div>
