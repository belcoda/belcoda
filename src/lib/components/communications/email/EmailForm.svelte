<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';
	import type { ReadEmailMessageZero } from '$lib/schema/email-message';

	let {
		email = $bindable(),
		onSave,
		onSend,
		onDiscard
	}: {
		email?: ReadEmailMessageZero | null;
		onSave?: (data: any) => void;
		onSend?: (data: any) => void;
		onDiscard?: () => void;
	} = $props();

	let subject = $state(email?.subject || '');
	let body = $state(email?.body || null);
	let recipientCount = $state(email?.estimatedRecipientCount || 0);

	function handleSave() {
		onSave?.({
			subject,
			body
		});
	}

	function handleSend() {
		onSend?.({
			subject,
			body
		});
	}
</script>

<div class="flex h-full flex-col">
	<div class="border-b p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">
				{email ? 'Edit Draft' : 'Compose Email'}
			</h2>
			<div class="flex gap-2">
				{#if onDiscard}
					<Button variant="destructive" size="sm" onclick={onDiscard}>
						Discard
					</Button>
				{/if}
				<Button variant="outline" size="sm" onclick={handleSave}>
					Save Draft
				</Button>
				<Button size="sm" onclick={handleSend}>
					Send
				</Button>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-4xl space-y-6">
			<div class="space-y-2">
				<Label for="recipients">Recipients</Label>
				<div class="flex items-center gap-2">
					<Input
						id="recipients"
						type="text"
						placeholder="Select recipients..."
						readonly
						value={recipientCount > 0 ? `${recipientCount} recipients selected` : 'No recipients selected'}
						class="flex-1"
					/>
					<Button variant="outline" size="sm">
						Select
					</Button>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="subject">Subject</Label>
				<Input
					id="subject"
					type="text"
					placeholder="Enter email subject..."
					bind:value={subject}
				/>
			</div>

			<div class="space-y-2">
				<Label for="body">Message</Label>
				<div class="rounded-md border">
					<SvelteLexical />
				</div>
			</div>
		</div>
	</div>
</div>
