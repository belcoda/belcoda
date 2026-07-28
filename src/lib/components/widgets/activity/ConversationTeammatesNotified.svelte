<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import type { ReadActivityZero } from '$lib/schema/activity';
	import { t } from '$lib/index.svelte';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';
	import * as dateUtils from '$lib/utils/date';

	const { activity }: { activity: ReadActivityZero } = $props();
	const actor = $derived.by(() =>
		activity.userId ? z.createQuery(queries.user.read({ userId: activity.userId })) : null
	);
</script>

<div class="w-full px-4 py-2 text-center text-sm text-gray-400">
	<div class="text-xs">
		{dateUtils.formatShortTimestamp(new Date(activity.createdAt).getTime())}
	</div>
	<div class="flex items-center justify-center gap-1">
		<UserPlusIcon class="size-3" />
		{#if actor?.data}
			{t`${actor.data.name} notified teammates about this person`}
		{:else}
			{t`Teammates were notified about this person`}
		{/if}
	</div>
</div>
