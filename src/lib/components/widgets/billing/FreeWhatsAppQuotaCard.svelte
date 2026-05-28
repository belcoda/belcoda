<script lang="ts">
	import { t } from '$lib/index.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	type Props = {
		remaining: number | null | undefined;
		resetsAt: number | null | undefined;
	};

	const { remaining, resetsAt }: Props = $props();

	const formattedRemaining = $derived(new Intl.NumberFormat('en-US').format(remaining ?? 0));

	const formattedResetDate = $derived.by(() => formatResetDate(resetsAt));

	function formatResetDate(value: number | null | undefined) {
		if (value == null) {
			return t`Not scheduled`;
		}
		const dateValue = new Date(value);
		if (Number.isNaN(dateValue.getTime())) {
			return t`Not scheduled`;
		}
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(dateValue);
	}
</script>

<Card.Root data-testid="free-whatsapp-quota-card">
	<Card.Header>
		<div class="flex items-center gap-3">
			<div
				class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200"
			>
				<MessageCircle class="size-5 text-green-600" />
			</div>
			<div>
				<Card.Title>{t`Free WhatsApp messages`}</Card.Title>
				<Card.Description
					>{t`Remaining free messages this month for your organization.`}</Card.Description
				>
			</div>
		</div>
	</Card.Header>
	<Card.Content>
		<p class="text-3xl font-semibold">{formattedRemaining}</p>
		<p class="mt-2 text-sm text-muted-foreground">
			{t`Resets on ${formattedResetDate}`}
		</p>
	</Card.Content>
</Card.Root>
