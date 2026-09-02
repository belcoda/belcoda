<script lang="ts">
	import BellIcon from '@lucide/svelte/icons/bell';
	import NotificationInbox from '$lib/components/widgets/notifications/NotificationInbox.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let open = $state(false);

	const unreadCount = $derived(appState.unreadNotificationCount);
	const unreadBadgeText = $derived(unreadCount > 99 ? '99+' : `${unreadCount}`);
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class={cn('relative', className)}
				aria-label={t`Open notifications`}
				data-testid="notifications-bell"
			>
				<BellIcon class="size-5" />
				{#if unreadCount > 0}
					<span
						class="text-destructive-foreground absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-5 font-semibold"
					>
						{unreadBadgeText}
					</span>
				{/if}
			</Button>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content side="right" class="w-full p-0 sm:max-w-md" data-testid="notifications-inbox">
		<NotificationInbox />
	</Sheet.Content>
</Sheet.Root>
