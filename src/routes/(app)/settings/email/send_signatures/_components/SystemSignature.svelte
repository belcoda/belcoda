<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { parse } from 'valibot';
	import { renderValiError, shortString, email } from '$lib/schema/helpers';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { toast } from 'svelte-sonner';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { updateSystemFromIdentityMutatorSchemaZero } from '$lib/schema/email-from-signature';

	type Props = {
		organizationId: string;
		name: string | null;
		replyTo: string | null;
		emailAddress: string;
	};

	let { organizationId, name, replyTo, emailAddress }: Props = $props();

	let editingName = $state(false);
	let editingReplyTo = $state(false);
	/* svelte-ignore state_referenced_locally */
	let newName = $state(name || '');
	/* svelte-ignore state_referenced_locally */
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
			const toUpdate = {
				input: {
					...(updates.name !== undefined && { name: updates.name }),
					...(updates.replyTo !== undefined && { replyTo: updates.replyTo })
				},
				metadata: {
					organizationId
				}
			};

			const parsed = parse(updateSystemFromIdentityMutatorSchemaZero, toUpdate);
			const response = z.mutate(mutators.emailFromSignature.updateSystemFromIdentity(parsed));
			await response.server;

			if (updates.name !== undefined) {
				editingName = false;
			}
			if (updates.replyTo !== undefined) {
				editingReplyTo = false;
			}

			toast.success(t`System signature updated successfully`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : t`Failed to update system signature`;
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

<div class="space-y-4" data-testid="settings-send-signature-system-section">
	<div data-testid="settings-send-signature-system-email-address-section">
		<p class="mb-1 text-sm font-medium">{t`Email address`}</p>
		<p
			class="font-mono text-sm text-muted-foreground"
			data-testid="settings-send-signature-system-email-address"
		>
			{emailAddress}
		</p>
		<p class="mt-1 text-xs text-muted-foreground">{t`This email address cannot be changed.`}</p>
	</div>

	<div data-testid="settings-send-signature-system-name-section">
		<p class="mb-1 text-sm font-medium">{t`Display name`}</p>
		{#if editingName}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Input
						bind:value={newName}
						placeholder={t`Display name`}
						class="flex-1"
						disabled={saving}
						data-testid="settings-send-signature-system-name-input"
					/>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleSaveName}
						disabled={saving}
						data-testid="settings-send-signature-system-name-save-button"
					>
						<CheckIcon class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleCancelName}
						disabled={saving}
						data-testid="settings-send-signature-system-name-cancel-button"
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
					data-testid="settings-send-signature-system-name-edit-button"
				>
					<PencilIcon class="size-4" />
				</Button>
			</div>
		{/if}
	</div>

	<div data-testid="settings-send-signature-system-reply-to-section">
		<p class="mb-1 text-sm font-medium">{t`Reply-to address`}</p>
		{#if editingReplyTo}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Input
						bind:value={newReplyTo}
						type="email"
						placeholder={emailAddress}
						class="flex-1 font-mono"
						disabled={saving}
						data-testid="settings-send-signature-system-reply-to-input"
					/>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleSaveReplyTo}
						disabled={saving}
						data-testid="settings-send-signature-system-reply-to-save-button"
					>
						<CheckIcon class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleCancelReplyTo}
						disabled={saving}
						data-testid="settings-send-signature-system-reply-to-cancel-button"
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
				<p class="font-mono text-sm">{replyTo || emailAddress}</p>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => {
						editingReplyTo = true;
						newReplyTo = replyTo || emailAddress;
					}}
					data-testid="settings-send-signature-system-reply-to-edit-button"
				>
					<PencilIcon class="size-4" />
				</Button>
			</div>
		{/if}
	</div>
</div>
