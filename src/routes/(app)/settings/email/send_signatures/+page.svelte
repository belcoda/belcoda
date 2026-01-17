<script lang="ts">
	import { t } from '$lib';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import { listEmailFromSignatures } from '$lib/zero/query/email_from_signature/list';
	import { readOrganization } from '$lib/zero/query/organizations/read';
	import { page } from '$app/state';
	const { postmarkSendingDomain } = page.data;
	let emailFromSignatureListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const emailFromSignatureList = $derived.by(() =>
		z.createQuery(listEmailFromSignatures(appState.queryContext, emailFromSignatureListFilter))
	);
	const organization = $derived.by(() =>
		z.createQuery(readOrganization(appState.queryContext, { organizationId: appState.organizationId }))
	);
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import * as Table from '$lib/components/ui/table/index.js';
	import Badge from '$lib/components/ui/colorbadge/badge.svelte';
	import { Badge as ShadcnBadge } from '$lib/components/ui/badge/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import InfoIcon from '@lucide/svelte/icons/info';
	import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import SystemSignature from './_components/SystemSignature.svelte';
	import { toast } from 'svelte-sonner';

	let loadingArr: string[] = $state([]);

	async function verifyEmailFromSignature(emailFromSignatureId: string) {
		loadingArr.push(emailFromSignatureId);
		try {
			const response = await fetch(`/api/utils/postmark/verify_send_signature/${emailFromSignatureId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				let errorMessage = `Failed to verify signature: ${response.statusText}`;
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

			toast.success(t`Email signature verification status updated`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t`Failed to verify email signature`;
			toast.error(errorMessage);
		} finally {
			loadingArr = loadingArr.filter((id) => id !== emailFromSignatureId);
		}
	}

	async function deleteEmailFromSignature(emailFromSignatureId: string) {
		if (window.confirm(t`Are you sure you want to delete this email signature?`)) {
			await z.mutate.emailFromSignature.delete({
				metadata: {
					organizationId: appState.organizationId,
					emailFromSignatureId
				}
			});
		}
	}

	const systemEmailAddress = $derived(
		organization.data ? `${organization.data.slug}@${postmarkSendingDomain}` : ''
	);
</script>

<ContentLayout rootLink="/settings">
	<Alert.Root>
		<AlertCircleIcon />
		<Alert.Title>{t`Email from signatures`}</Alert.Title>
		<Alert.Description>
			<p>
				{t`Email from signatures are the names and email addresses that are used to send emails on behalf
  of the organization. You can add as many as you want, but they must be attached to a
  non-public email address that you control.`}
			</p>
		</Alert.Description>
	</Alert.Root>

	{#if organization.data}
		<Card.Root class="mt-6">
			<Card.Header>
				<Card.Title>{t`System send signature`}</Card.Title>
				<Card.Description>
					{t`This is the default send signature provided to every organization. You can customize the name and reply-to address.`}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<SystemSignature
					organizationId={organization.data.id}
					name={organization.data.settings.email.systemFromIdentity.name}
					replyTo={organization.data.settings.email.systemFromIdentity.replyTo}
					emailAddress={systemEmailAddress}
				/>
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root class="mt-6">
		<Card.Header>
			<Card.Title>{t`Custom send signatures`}</Card.Title>
			<Card.Description>
				{t`Additional email signatures that you can use to send emails. These must be verified with Postmark.`}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<!-- Desktop Table View -->
			<div class="hidden md:block overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>{t`Name & Email`}</Table.Head>
							<Table.Head>{t`Reply-to`}</Table.Head>
							<Table.Head>
								<div class="flex items-center gap-2">
									{t`Return path`}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<InfoIcon class="size-3 text-muted-foreground" />
										</Tooltip.Trigger>
										<Tooltip.Content>
											{t`The return path domain is used for bounce handling.`}
										</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center gap-2">
									{t`Status`}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<InfoIcon class="size-3 text-muted-foreground" />
										</Tooltip.Trigger>
										<Tooltip.Content>
											{t`Verification status from Postmark.`}
										</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</Table.Head>
							<Table.Head class="w-[100px]">{t`Actions`}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each emailFromSignatureList.data as signature}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<Avatar>
											<AvatarFallback>{signature.emailAddress[0]?.toUpperCase()}</AvatarFallback>
										</Avatar>
										<div>
											<p class="text-sm font-semibold">{signature.name}</p>
											<p class="text-sm text-muted-foreground font-mono">
												{signature.emailAddress}
											</p>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<p class="text-sm font-mono">
										{signature.replyTo || signature.emailAddress}
									</p>
								</Table.Cell>
								<Table.Cell>
									{#if signature.returnPathDomain}
										<div class="space-y-1">
											<p class="text-sm">{signature.returnPathDomain}</p>
											<Badge
												color={signature.returnPathDomainVerified ? 'green' : 'red'}
											>
												{signature.returnPathDomainVerified ? t`Verified` : t`Not verified`}
											</Badge>
										</div>
									{:else}
										<Badge color="gray">{t`Not set`}</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<Badge color={signature.verified ? 'green' : 'red'}>
										{signature.verified ? t`Verified` : t`Not verified`}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										{#if signature.externalId}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button
														variant="ghost"
														size="icon-sm"
														onclick={() => verifyEmailFromSignature(signature.id)}
														disabled={loadingArr.includes(signature.id)}
													>
														{#if loadingArr.includes(signature.id)}
															<LoaderIcon class="size-4 animate-spin" />
														{:else}
															<RefreshCcwIcon class="size-4" />
														{/if}
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content>
													{t`Verify signature status`}
												</Tooltip.Content>
											</Tooltip.Root>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button
														variant="ghost"
														size="icon-sm"
														onclick={() => deleteEmailFromSignature(signature.id)}
													>
														<TrashIcon class="size-4 text-destructive" />
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content>
													{t`Delete signature`}
												</Tooltip.Content>
											</Tooltip.Root>
										{:else}
											<ShadcnBadge variant="outline">{t`System`}</ShadcnBadge>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
						{#if emailFromSignatureList.details.type !== 'complete'}
							<Table.Row>
								<Table.Cell colspan={5} class="text-center text-muted-foreground">
									{t`Loading...`}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Mobile Card View -->
			<div class="space-y-4 md:hidden">
				{#each emailFromSignatureList.data as signature}
					<Card.Root>
						<Card.Content class="pt-6">
							<div class="space-y-4">
								<div class="flex items-center gap-3">
									<Avatar>
										<AvatarFallback>{signature.emailAddress[0]?.toUpperCase()}</AvatarFallback>
									</Avatar>
									<div class="flex-1">
										<p class="text-sm font-semibold">{signature.name}</p>
										<p class="text-sm text-muted-foreground font-mono">
											{signature.emailAddress}
										</p>
									</div>
									<div class="flex items-center gap-2">
										{#if signature.externalId}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => verifyEmailFromSignature(signature.id)}
												disabled={loadingArr.includes(signature.id)}
											>
												{#if loadingArr.includes(signature.id)}
													<LoaderIcon class="size-4 animate-spin" />
												{:else}
													<RefreshCcwIcon class="size-4" />
												{/if}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onclick={() => deleteEmailFromSignature(signature.id)}
											>
												<TrashIcon class="size-4 text-destructive" />
											</Button>
										{:else}
											<ShadcnBadge variant="outline">{t`System`}</ShadcnBadge>
										{/if}
									</div>
								</div>

								<div>
									<p class="text-xs font-medium text-muted-foreground uppercase mb-1">
										{t`Reply-to`}
									</p>
									<p class="text-sm font-mono">
										{signature.replyTo || signature.emailAddress}
									</p>
								</div>

								<div>
									<p class="text-xs font-medium text-muted-foreground uppercase mb-1">
										{t`Return path`}
									</p>
									{#if signature.returnPathDomain}
										<div class="space-y-1">
											<p class="text-sm">{signature.returnPathDomain}</p>
											<Badge
												color={signature.returnPathDomainVerified ? 'green' : 'red'}
											>
												{signature.returnPathDomainVerified ? t`Verified` : t`Not verified`}
											</Badge>
										</div>
									{:else}
										<Badge color="gray">{t`Not set`}</Badge>
									{/if}
								</div>

								<div>
									<p class="text-xs font-medium text-muted-foreground uppercase mb-1">
										{t`Status`}
									</p>
									<Badge color={signature.verified ? 'green' : 'red'}>
										{signature.verified ? t`Verified` : t`Not verified`}
									</Badge>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
				{#if emailFromSignatureList.details.type !== 'complete'}
					<Card.Root>
						<Card.Content class="pt-6">
							<p class="text-center text-muted-foreground">{t`Loading...`}</p>
						</Card.Content>
					</Card.Root>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>{t`Email from signatures`}</H2>
			<ResponsiveModal>
				<h1>{t`Add Email from signature`}</h1>
				{#snippet trigger()}
					<Button variant="outline">
						<PlusIcon class="size-4" />
						{t`New`}
					</Button>
				{/snippet}
			</ResponsiveModal>
		</div>
	{/snippet}
</ContentLayout>
