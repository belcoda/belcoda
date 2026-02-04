<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';
	import EmailFrom from '$lib/components/ui/custom-select/email-from/email-from.svelte';
	import type { ReadEmailMessageZero } from '$lib/schema/email-message';
	import type { FilterGroupType } from '$lib/schema/filter/types';

	type UpdateEmailData = {
		subject: string | undefined;
		body: any | undefined;
		emailFromSignatureId: string | undefined;
		recipients: FilterGroupType;
	};

	let {
		email = $bindable(),
		handleUpdate
	}: {
		email: ReadEmailMessageZero;
		handleUpdate?: (data: UpdateEmailData) => void;
	} = $props();

	let subject = $state('');
	let body = $state(null);
	let recipientCount = $derived(email?.estimatedRecipientCount || 0);

	// $effect.pre runs before the DOM updates which prevents flickers
	$effect.pre(() => {
		if (email) {
			subject = email.subject || '';
			body = email.body || null;
		}
	});

	import { useDebounce } from 'runed';
	function triggerUpdate() {
		handleUpdate?.({
			subject,
			body: body ? JSON.parse(JSON.stringify(body)) : null,
			emailFromSignatureId: email?.emailFromSignatureId ?? undefined,
			recipients: email?.recipients ?? { type: 'or', filters: [], exclude: [] }
		});
	}
	const debouncedTriggerUpdate = useDebounce(triggerUpdate, 1000);
</script>

<div class="flex h-full flex-col">
	<div class="flex-1">
		<div class="mx-auto max-w-4xl space-y-6">
			<div class="space-y-2">
				<Label for="recipients">From</Label>
				<div class="flex items-center gap-2">
					<EmailFrom
						bind:value={email.emailFromSignatureId}
						onValueChange={debouncedTriggerUpdate}
					/>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="recipients">Recipients</Label>
				<div class="flex items-center gap-2">
					<Input
						id="recipients"
						type="text"
						placeholder="Select recipients..."
						readonly
						value={recipientCount > 0
							? `${recipientCount} recipients selected`
							: 'No recipients selected'}
						class="flex-1"
					/>
					<Button variant="outline" size="sm">Select</Button>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="subject">Subject</Label>
				<Input
					id="subject"
					type="text"
					placeholder="Enter email subject..."
					bind:value={subject}
					oninput={debouncedTriggerUpdate}
				/>
			</div>

			<div class="space-y-2">
				<Label for="body">Message</Label>
				{#key email?.id}
					<SvelteLexical bind:value={body} onChange={debouncedTriggerUpdate} />
				{/key}
			</div>
		</div>
	</div>
</div>
