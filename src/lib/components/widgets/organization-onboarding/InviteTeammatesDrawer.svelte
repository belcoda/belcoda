<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import { safeParse } from 'valibot';
	import { email as emailSchema } from '$lib/schema/helpers';
	import {
		parseInvitationEmails,
		sendInvitations,
		recordInvitationProgress,
		type InvitationOrganization
	} from './send-invitations';
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
	let addressErrors = $state<Record<string, string>>({});
	let progressPending = $state<InvitationOrganization | null>(null);
	const invitationCount = $derived(new Set([...emails, ...parseInvitationEmails(draft)]).size);

	const roles: { value: Role; label: string; description: string }[] = [
		{
			value: 'member',
			label: t`Member`,
			description: t`Works with the people and activities in their assigned teams.`
		},
		{
			value: 'admin',
			label: t`Admin`,
			description: t`Manages organization settings, teams, and invitations.`
		},
		{
			value: 'owner',
			label: t`Owner`,
			description: t`Has full control of the organization, including managing owners.`
		}
	];
	const roleDescription = $derived(roles.find((r) => r.value === role)?.description);
	const availableRoles = $derived(
		appState.isOwner ? roles : roles.filter((r) => r.value !== 'owner')
	);
	const roleLabel = $derived(roles.find((r) => r.value === role)?.label ?? t`Member`);

	function commitDraft() {
		if (submitting) return;
		emails = [...new Set([...emails, ...parseInvitationEmails(draft)])];
		draft = '';
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
			event.preventDefault();
			commitDraft();
		} else if (event.key === 'Backspace' && draft === '' && emails.length) {
			removeEmail(emails[emails.length - 1]);
		}
	}

	function removeEmail(email: string) {
		emails = emails.filter((e) => e !== email);
		delete addressErrors[email];
	}

	function onPaste(event: ClipboardEvent) {
		const text = event.clipboardData?.getData('text');
		if (!text || !/[\s,;]/.test(text)) return;
		event.preventDefault();
		commitDraft();
		emails = [...new Set([...emails, ...parseInvitationEmails(text)])];
	}

	async function send() {
		if (submitting || !appState.isAdminOrOwner) return;
		commitDraft();
		addressErrors = {};
		for (const email of emails) {
			if (!safeParse(emailSchema, email).success)
				addressErrors[email] =
					t`Check this email address. Remove it and enter the corrected address.`;
		}
		if (!emails.length || Object.keys(addressErrors).length) return;
		const organization = appState.activeOrganization.data;
		if (!organization) return;
		submitting = true;
		try {
			const result = await sendInvitations(organization, [...emails], role);
			if (appState.organizationId !== organization.id) return;
			emails = result.failed;
			addressErrors = Object.fromEntries(
				result.failed.map((email) => [
					email,
					t`Invitation could not be sent. Check the address or try again.`
				])
			);
			if (result.sent.length) {
				toast.success(
					result.sent.length === 1
						? t`1 invitation sent`
						: t`${String(result.sent.length)} invitations sent`
				);
				onsent?.(result.sent);
				progressPending = result.progressSaved ? null : organization;
			}
			if (!result.failed.length && !progressPending) {
				role = 'member';
				open = false;
			}
		} finally {
			submitting = false;
		}
	}

	async function retryProgress() {
		if (!progressPending || submitting) return;
		const organization = progressPending;
		submitting = true;
		try {
			await recordInvitationProgress(organization);
			if (appState.organizationId !== organization.id) return;
			progressPending = null;
			if (!emails.length && !draft.trim()) open = false;
		} catch {
			toast.error(
				t`Your invitations were sent, but progress could not be saved. Please try again.`
			);
		} finally {
			submitting = false;
		}
	}

	function skip() {
		onskip?.();
		open = false;
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Content>
		<div class="mx-auto max-h-[85svh] w-full max-w-md overflow-y-auto">
			<Drawer.Header>
				<Drawer.Title>{t`Invite teammates`}</Drawer.Title>
				<Drawer.Description>
					{t`Optional. Run Belcoda solo and add people whenever.`}
				</Drawer.Description>
			</Drawer.Header>

			<fieldset disabled={submitting} class="flex min-w-0 flex-col gap-4 px-4">
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
							inputmode="email"
							autocapitalize="none"
							spellcheck={false}
							aria-describedby="invite-email-help"
							bind:value={draft}
							onkeydown={onKeydown}
							onpaste={onPaste}
							onblur={commitDraft}
							placeholder={emails.length ? t`add another…` : t`name@example.org`}
							class="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
						/>
					</div>
				</div>

				<p id="invite-email-help" class="text-sm text-muted-foreground">
					{t`Separate addresses with commas, semicolons, or new lines. Press Enter to add an address.`}
				</p>
				{#if Object.keys(addressErrors).length}
					<ul role="alert" class="space-y-2 text-sm text-destructive">
						{#each Object.entries(addressErrors) as [email, message] (email)}
							<li><strong class="break-all">{email}</strong>: {message}</li>
						{/each}
					</ul>
				{/if}
				{#if progressPending}
					<div role="status" class="rounded-lg border p-3 text-sm">
						<p>{t`Your invitations were sent. We couldn’t save your setup progress.`}</p>
						<Button variant="outline" class="mt-2" onclick={retryProgress}
							>{t`Retry saving progress`}</Button
						>
					</div>
				{/if}
				<div class="flex flex-col gap-2">
					<Label for="invite-role">{t`Role for these teammates`}</Label>
					<Select.Root type="single" bind:value={role}>
						<Select.Trigger id="invite-role" aria-describedby="invite-role-help" class="w-full"
							>{roleLabel}</Select.Trigger
						>
						<Select.Content>
							{#each availableRoles as option (option.value)}
								<Select.Item value={option.value} label={option.label} />
							{/each}
						</Select.Content>
					</Select.Root>
					<p id="invite-role-help" class="text-sm text-muted-foreground">{roleDescription}</p>
				</div>
			</fieldset>

			<Drawer.Footer class="flex-col gap-3 sm:flex-row sm:items-center">
				<Button
					class="flex-1"
					onclick={send}
					disabled={submitting || (emails.length === 0 && draft.trim() === '')}
				>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						{t`Sending…`}
					{:else if invitationCount === 1}
						{t`Send 1 invitation`}
					{:else if invitationCount > 1}
						{t`Send ${String(invitationCount)} invitations`}
					{:else}
						{t`Send invitations`}
					{/if}
				</Button>
				<Button variant="ghost" onclick={skip} disabled={submitting}>
					{t`Do this later`}
				</Button>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
