<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { authClient } from '$lib/auth-client';
	import { appState } from '$lib/state.svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import PlusIcon from '@lucide/svelte/icons/plus';

	type Props = {
		onInvited?: () => void;
	};
	let { onInvited }: Props = $props();

	let isOpen = $state(false);
	let email = $state('');
	let role = $state<'member' | 'admin' | 'owner'>('member');
	let submitting = $state(false);

	const ROLES = [
		{ value: 'member', label: () => t`Member` },
		{ value: 'admin', label: () => t`Admin` },
		{ value: 'owner', label: () => t`Owner` }
	];

	function getRoleLabel(value: string): string {
		return ROLES.find((r) => r.value === value)?.label() ?? value;
	}

	async function handleInvite() {
		if (!email.trim()) {
			toast.error(t`Please enter an email address`);
			return;
		}

		try {
			submitting = true;
			const result = await authClient.organization.inviteMember({
				email: email.trim(),
				role: role,
				organizationId: appState.organizationId
			});

			if (result.error) {
				throw new Error(result.error.message || t`Failed to send invitation`);
			}

			toast.success(t`Invitation sent to ${email.trim()}`);
			email = '';
			role = 'member';
			isOpen = false;
			onInvited?.();
		} catch (e: any) {
			toast.error(e.message || t`Failed to send invitation`);
			console.error('Error inviting user:', e);
		} finally {
			submitting = false;
		}
	}
</script>

<ResponsiveModal
	title={t`Invite User`}
	description={t`Send an invitation to join your organization.`}
	bind:open={isOpen}
>
	{#snippet trigger()}
		<Button variant="outline"><PlusIcon /> {t`Invite`}</Button>
	{/snippet}
	{#snippet children()}
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="invite-email">{t`Email address`}</Label>
				<Input
					id="invite-email"
					type="email"
					bind:value={email}
					placeholder={t`user@example.com`}
					disabled={submitting}
				/>
			</div>
			<div class="space-y-2">
				<Label>{t`Role`}</Label>
				<Select.Root type="single" bind:value={role}>
					<Select.Trigger class="w-full">
						{getRoleLabel(role)}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each ROLES as r (r.value)}
								<Select.Item value={r.value} label={r.label()}>
									{r.label()}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="outline" onclick={() => (isOpen = false)} disabled={submitting}>
				{t`Cancel`}
			</Button>
			<Button onclick={handleInvite} disabled={submitting || !email.trim()}>
				{#if submitting}
					<Spinner class="mr-2 h-4 w-4" />
					{t`Sending...`}
				{:else}
					{t`Send invitation`}
				{/if}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
