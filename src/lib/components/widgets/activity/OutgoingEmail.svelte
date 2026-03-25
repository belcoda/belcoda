<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import * as dateUtils from '$lib/utils/date';
	import Mail from '@lucide/svelte/icons/mail';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();

	const emailMessage = $derived.by(() => {
		return z.createQuery(queries.emailMessage.read({ emailMessageId: activity.referenceId }));
	});
</script>

{#if emailMessage.data}
	<div class="w-full px-4 py-2 text-center text-sm text-gray-400">
		<div class="text-xs">
			{dateUtils.formatShortTimestamp(new Date(activity.createdAt).getTime())}
		</div>
		<div class="flex items-center justify-center gap-1">
			Email sent:
			<a
				class="flex items-center gap-1"
				href={`/communications/email/sent/${emailMessage.data.id}`}
			>
				<Mail class="size-3" />
				<div class="font-medium underline hover:text-gray-500">
					{emailMessage.data.subject || '(no subject)'}
				</div>
			</a>
		</div>
	</div>
{/if}
