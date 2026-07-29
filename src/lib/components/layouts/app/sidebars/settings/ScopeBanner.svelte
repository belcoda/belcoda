<script lang="ts">
	import type { SettingsScope } from '$lib/components/layouts/app/sidebars/settings/items';
	import { t } from '$lib/index.svelte';
	import UserIcon from '@lucide/svelte/icons/user';
	import BuildingIcon from '@lucide/svelte/icons/building';

	const { scope }: { scope: SettingsScope } = $props();
</script>

{#if scope === 'account'}
	<div
		class="flex shrink-0 items-center gap-2 border-b bg-accent px-4 py-2 text-sm text-accent-foreground"
	>
		<UserIcon class="size-4 shrink-0" />
		<span>{t`Only affects you. Other teammates keep their own settings.`}</span>
	</div>
{:else}
	<div
		class="flex shrink-0 items-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
	>
		<BuildingIcon class="size-4 shrink-0" />
		<span>{t`Affects everyone in your workspace. Admin only.`}</span>
	</div>
{/if}
