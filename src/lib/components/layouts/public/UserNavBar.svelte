<script lang="ts">
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	const {
		session,
		linkUrl,
		linkText
	}: { session: App.Locals['session'] | null; linkUrl: string; linkText: string } = $props();
	import { Button } from '$lib/components/ui/button/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
</script>

{#if session}
	<div class="fixed top-0 right-0 left-0 z-50 bg-foreground shadow-lg">
		<div class="mx-auto px-4">
			<div class="flex h-12 items-center justify-between py-1">
				<!-- User Info -->
				<div class="flex items-center gap-3">
					<div class="size-9">
						<Avatar src={session.user.image} name1={session.user.name} />
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-medium text-primary-foreground">
							{session.user.name}
						</span>
					</div>
				</div>

				<!-- Edit Button -->
				<Button href={linkUrl} variant="secondary" size="sm" class="gap-2 shadow-md">
					<PencilIcon class="size-4" />
					{linkText}
				</Button>
			</div>
		</div>
	</div>
	<!-- Spacer to prevent content from being hidden behind the fixed navbar -->
	<div class="h-12"></div>
{/if}
