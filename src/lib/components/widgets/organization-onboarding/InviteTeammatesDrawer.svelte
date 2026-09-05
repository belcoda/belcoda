<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { authClient } from '$lib/auth-client';
	import { appState } from '$lib/state.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import XIcon from '@lucide/svelte/icons/x';

	type Role = 'member' | 'admin' | 'owner';

	let {
		open = $bindable(false),
		onsent,
		onskip
	}: {
		open?: boolean;
		onsent?: (emails: string[]) => void;
		onskip?: () => void;
	} = $props();

	let emails = $state<string[]>([]);
	let draft = $state('');
	let role = $state<Role>('member');
	let submitting = $state(false);

	const roles: { value: Role; label: string }[] = [
		{ value: 'member', label: t`Member` },
		{ value: 'admin', label: t`Admin` },
		{ value: 'owner', label: t`Owner` }
	];
	const roleLabel = $derived(roles.find((r) => r.value === role)?.label ?? t`Member`);

	function commitDraft() {
		const value = draft.trim().replace(/,$/, '').trim();
		if (value && !emails.includes(value)) emails = [...emails, value];
		draft = '';
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			commitDraft();
		} else if (event.key === 'Backspace' && draft === '' && emails.length) {
			emails = emails.slice(0, -1);
		}
	}

	function removeEmail(email: string) {
		emails = emails.filter((e) => e !== email);
	}

	async function send() {
		commitDraft();
		if (emails.length === 0) return;

		const pending = [...emails];
		submitting = true;
		// Better Auth invites one member per call, so fan the chips out in parallel.
		const results = await Promise.allSettled(
			pending.map((email) =>
				authClient.organization
					.inviteMember({ email, role, organizationId: appState.organizationId })
					.then((result) => {
						if (result.error) throw new Error(result.error.message ?? email);
					})
			)
		);
		submitting = false;

		const sentEmails = pending.filter((_, i) => results[i].status === 'fulfilled');
		const failedEmails = pending.filter((_, i) => results[i].status === 'rejected');

		if (sentEmails.length > 0) {
			toast.success(
				sentEmails.length === 1
					? t`1 invitation sent`
					: t`${String(sentEmails.length)} invitations sent`
			);
			onsent?.(sentEmails);
		}
		if (failedEmails.length > 0) {
			toast.error(
				failedEmails.length === 1
					? t`1 invitation could not be sent`
					: t`${String(failedEmails.length)} invitations could not be sent`
			);
		}

		// Keep only the addresses that failed, so a retry does not re-invite the successful ones.
		emails = failedEmails;
		if (failedEmails.length === 0) {
			role = 'member';
			open = false;
		}
	}

	function skip() {
		onskip?.();
		open = false;
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Content>
		<div class="mx-auto w-full max-w-md">
			<Drawer.Header>
				<Drawer.Title>{t`Invite teammates`}</Drawer.Title>
				<Drawer.Description>
					{t`Optional. Run Belcoda solo and add people whenever.`}
				</Drawer.Description>
			</Drawer.Header>

			<div class="flex flex-col gap-4 px-4">
				<div class="flex flex-col gap-2">
					<Label for="invite-emails">{t`Email addresses`}</Label>
					<div
						class="flex flex-wrap items-center gap-1.5 rounded-md border bg-background p-1.5 focus-within:ring-1 focus-within:ring-ring"
					>
						{#each emails as email (email)}
							<span
								class="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm text-foreground"
							>
								{email}
								<button
									type="button"
									aria-label={t`Remove ${email}`}
									onclick={() => removeEmail(email)}
									class="text-muted-foreground hover:text-foreground"
								>
									<XIcon class="size-3" />
								</button>
							</span>
						{/each}
						<input
							id="invite-emails"
							bind:value={draft}
							onkeydown={onKeydown}
							onblur={commitDraft}
							placeholder={emails.length ? t`add another…` : t`name@example.org`}
							class="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<Label>{t`Role`}</Label>
					<Select.Root type="single" bind:value={role}>
						<Select.Trigger class="w-full">{roleLabel}</Select.Trigger>
						<Select.Content>
							{#each roles as option (option.value)}
								<Select.Item value={option.value} label={option.label} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<Drawer.Footer class="flex-row items-center gap-3">
				<Button
					class="flex-1"
					onclick={send}
					disabled={submitting || (emails.length === 0 && draft.trim() === '')}
				>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						{t`Sending…`}
					{:else if emails.length === 1}
						{t`Send 1 invitation`}
					{:else if emails.length > 1}
						{t`Send ${String(emails.length)} invitations`}
					{:else}
						{t`Send invitations`}
					{/if}
				</Button>
				<Button variant="ghost" onclick={skip} disabled={submitting}>
					{t`Skip — I'll do this later`}
				</Button>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
