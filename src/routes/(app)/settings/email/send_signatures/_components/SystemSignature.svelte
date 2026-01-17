<script lang="ts">
	import { t } from '$lib';
	import { parse } from 'valibot';
	import { renderValiError, shortString, email } from '$lib/schema/helpers';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { toast } from 'svelte-sonner';

	type Props = {
		organizationId: string;
		name: string | null;
		replyTo: string | null;
		emailAddress: string;
	};

	let { organizationId, name, replyTo, emailAddress }: Props = $props();

	let editingName = $state(false);
	let editingReplyTo = $state(false);
	let newName = $state(name || '');
	let newReplyTo = $state(replyTo || emailAddress);
	let nameError = $state<string | null>(null);
	let replyToError = $state<string | null>(null);
	let saving = $state(false);

	async function updateOrganizationSettings(updates: {
		name?: string | null;
		replyTo?: string | null;
	}) {
		saving = true;
		try {
			const response = await fetch(`/api/organization/settings`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					organizationId,
					settings: {
						email: {
							systemFromIdentity: {
								...(updates.name !== undefined && { name: updates.name }),
								...(updates.replyTo !== undefined && { replyTo: updates.replyTo })
							}
						}
					}
				})
			});

			if (!response.ok) {
				let errorMessage = `Failed to update: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch {
					// If JSON parsing fails, try to get text
					const text = await response.text().catch(() => '');
					errorMessage = text || errorMessage;
				}
				throw new Error(errorMessage);
			}

			// Update local state
			if (updates.name !== undefined) {
				name = updates.name;
				editingName = false;
			}
			if (updates.replyTo !== undefined) {
				replyTo = updates.replyTo;
				editingReplyTo = false;
			}

			toast.success(t`System signature updated successfully`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : t`Failed to update system signature`;
			toast.error(errorMessage);
		} finally {
			saving = false;
		}
	}

	function handleSaveName() {
		nameError = null;
		try {
			const parsed = parse(shortString, newName || null);
			updateOrganizationSettings({ name: parsed });
		} catch (err) {
			const vE = renderValiError(err);
			if (vE.isValiError) {
				nameError = vE.message;
			}
		}
	}

	function handleSaveReplyTo() {
		replyToError = null;
		try {
			const parsed = parse(email, newReplyTo || null);
			updateOrganizationSettings({ replyTo: parsed });
		} catch (err) {
			const vE = renderValiError(err);
			if (vE.isValiError) {
				replyToError = vE.message;
			}
		}
	}

	function handleCancelName() {
		newName = name || '';
		nameError = null;
		editingName = false;
	}

	function handleCancelReplyTo() {
		newReplyTo = replyTo || emailAddress;
		replyToError = null;
		editingReplyTo = false;
	}
</script>

<div class="space-y-4">
	<div>
		<p class="text-sm font-medium mb-1">{t`Email address`}</p>
		<p class="text-sm text-muted-foreground font-mono">{emailAddress}</p>
		<p class="text-xs text-muted-foreground mt-1">{t`This email address cannot be changed.`}</p>
	</div>

	<div>
		<p class="text-sm font-medium mb-1">{t`Display name`}</p>
		{#if editingName}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Input
						bind:value={newName}
						placeholder={t`Display name`}
						class="flex-1"
						disabled={saving}
					/>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleSaveName}
						disabled={saving}
					>
						<CheckIcon class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleCancelName}
						disabled={saving}
					>
						<XIcon class="size-4" />
					</Button>
				</div>
				{#if nameError}
					<p class="text-sm text-destructive">{nameError}</p>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<p class="text-sm">{name || t`Not set`}</p>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => {
						editingName = true;
						newName = name || '';
					}}
				>
					<PencilIcon class="size-4" />
				</Button>
			</div>
		{/if}
	</div>

	<div>
		<p class="text-sm font-medium mb-1">{t`Reply-to address`}</p>
		{#if editingReplyTo}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Input
						bind:value={newReplyTo}
						type="email"
						placeholder={emailAddress}
						class="flex-1 font-mono"
						disabled={saving}
					/>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleSaveReplyTo}
						disabled={saving}
					>
						<CheckIcon class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleCancelReplyTo}
						disabled={saving}
					>
						<XIcon class="size-4" />
					</Button>
				</div>
				{#if replyToError}
					<p class="text-sm text-destructive">{replyToError}</p>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<p class="text-sm font-mono">{replyTo || emailAddress}</p>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => {
						editingReplyTo = true;
						newReplyTo = replyTo || emailAddress;
					}}
				>
					<PencilIcon class="size-4" />
				</Button>
			</div>
		{/if}
	</div>
</div>
