<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	const navClass = cn(
		buttonVariants({ variant: 'ghost', size: 'default' }),
		'h-full w-full justify-center rounded-none'
	);
	import { appState } from '$lib/state.svelte';
</script>

<div class="bg-neutral-primary-soft border-default h-full w-full border-t">
	<div
		class="mx-auto grid h-full max-w-lg grid-cols-3 font-medium"
		class:grid-cols-4={appState.isAdminOrOwner}
	>
		<a href="/community" class={navClass}>
			<div class="text-center">
				<div class="icon-[lucide--users] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">{t`Community`}</div>
			</div>
		</a>
		{#if appState.isAdminOrOwner}
			<a href="/communications" class={navClass}>
				<div class="text-center">
					<div class="icon-[flowbite--messages-outline] size-6">&nbsp;</div>
					<div class="text-body group-hover:text-fg-brand mt-1 text-xs">{t`Communications`}</div>
				</div>
			</a>
		{/if}
		<a href="/events" class={navClass}>
			<div class="text-center">
				<div class="icon-[mdi--events] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">{t`Events`}</div>
			</div>
		</a>
		<a href="/petitions" class={navClass}>
			<div class="text-center">
				<div class="icon-[mage--zap] size-6">&nbsp;</div>
				<div class="text-body group-hover:text-fg-brand mt-1 text-xs">{t`Petitions`}</div>
			</div>
		</a>
	</div>
</div>
