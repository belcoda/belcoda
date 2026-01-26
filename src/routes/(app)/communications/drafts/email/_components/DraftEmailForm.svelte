<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { RichTextComposer } from 'svelte-lexical';
	import { theme } from 'svelte-lexical/dist/themes/default';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Info from '@lucide/svelte/icons/info';
	import Users from '@lucide/svelte/icons/users';
	import type { ReadEmailMessageZero } from '$lib/schema/email-message';
	import type { EmailFromSignature } from '$lib/zero/zero-schema.gen';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { debounce } from '$lib/utils/debounce';
	import RecipientSelector from './RecipientSelector.svelte';

	let {
		emailMessage: initialEmailMessage,
		fromSignatures
	}: {
		emailMessage: ReadEmailMessageZero;
		fromSignatures: EmailFromSignature[];
	} = $props();

	let emailMessage = $state(initialEmailMessage);
	let composer: RichTextComposer;
	let isSaving = $state(false);
	let recipientSelectorOpen = $state(false);

	const fromAddressOptions = fromSignatures.map((sig) => ({
		value: sig.id,
		label: `${sig.name} <${sig.emailAddress}>`
	}));

	const selectedFromAddress = $derived(
		fromAddressOptions.find((opt) => opt.value === emailMessage.emailFromSignatureId)
	);

	const saveChanges = debounce(async () => {
		isSaving = true;
		try {
			await z.mutate.emailMessage.update({
				metadata: {
					emailMessageId: emailMessage.id,
					organizationId: appState.organizationId
				},
				input: {
					subject: emailMessage.subject,
					body: emailMessage.body,
					emailFromSignatureId: emailMessage.emailFromSignatureId,
					replyToOverride: emailMessage.replyToOverride
				}
			});
		} finally {
			isSaving = false;
		}
	}, 1000);

	const sendEmail = async () => {
		if (emailMessage.recipients.filters.length === 0) {
			alert('Please select at least one recipient filter');
			return;
		}
		console.log('Send email:', emailMessage);
	};
</script>

<ContentLayout rootLink="/communications">
	<div class="container mx-auto max-w-4xl py-8">
		<div class="mb-6 flex items-center gap-4">
			<Button href="/communications/drafts" variant="ghost" size="icon">
				<ChevronLeft class="size-5" />
			</Button>
			<div class="flex-1">
				<h1 class="text-3xl font-bold">Email Draft</h1>
				<p class="text-muted-foreground mt-1 text-sm">
					{#if isSaving}
						Saving...
					{:else}
						All changes saved
					{/if}
				</p>
			</div>
			<div class="flex gap-2">
				<Button disabled={emailMessage.recipients.filters.length === 0} onclick={sendEmail}>
					Send Email
				</Button>
			</div>
		</div>

		<Card.Root>
			<Card.Content class="pt-6">
				<form class="space-y-6" onsubmit={(e) => e.preventDefault()}>
					<div class="space-y-2">
						<Label for="from">From</Label>
						<Select.Root
							selected={selectedFromAddress}
							onSelectedChange={(selected) => {
								if (selected) {
									emailMessage.emailFromSignatureId = selected.value;
									saveChanges();
								}
							}}
						>
							<Select.Trigger id="from">
								<Select.Value placeholder="Select sender" />
							</Select.Trigger>
							<Select.Content>
								{#each fromAddressOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label for="recipients">Recipients</Label>
						<button
							type="button"
							class="w-full rounded-lg border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
							onclick={() => (recipientSelectorOpen = true)}
						>
							<div class="flex items-center gap-3">
								<Users class="text-muted-foreground size-5" />
								<div class="flex-1">
									<p class="text-sm font-medium">
										{#if emailMessage.recipients.filters.length === 0}
											No recipients selected
										{:else}
											{emailMessage.recipients.filters.length} filter{emailMessage.recipients.filters.length === 1 ? '' : 's'} applied
										{/if}
									</p>
									<p class="text-muted-foreground text-xs">
										Estimated recipients: {emailMessage.estimatedRecipientCount}
									</p>
								</div>
								<Button variant="outline" size="sm" onclick={(e) => e.stopPropagation()}>
									Configure Recipients
								</Button>
							</div>
						</button>
					</div>

					<div class="space-y-2">
						<Label for="subject">Subject</Label>
						<Input
							id="subject"
							type="text"
							placeholder="Enter email subject"
							bind:value={emailMessage.subject}
							oninput={saveChanges}
						/>
					</div>

					<div class="space-y-2">
						<Label for="body">Message</Label>
						<div class="min-h-[400px] rounded-lg border">
							<RichTextComposer {theme} bind:this={composer} />
						</div>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</ContentLayout>

<RecipientSelector bind:recipients={emailMessage.recipients} bind:open={recipientSelectorOpen} />
