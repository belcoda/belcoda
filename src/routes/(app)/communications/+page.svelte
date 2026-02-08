<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Mail from '@lucide/svelte/icons/mail';
	import Send from '@lucide/svelte/icons/send';
	import PlusCircle from '@lucide/svelte/icons/plus-circle';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEmailMessages } from '$lib/zero/query/email_message/list';

	onMount(() => {
		// Rediect to emails because it's the only module we have so far
		goto('/communications/email/drafts', { replaceState: true });
	});

	const draftFilter = $state({
		...getListFilter(appState.organizationId),
		isDraft: true,
		pageSize: 5
	});

	const sentFilter = $state({
		...getListFilter(appState.organizationId),
		isDraft: false,
		pageSize: 5
	});

	const draftsQuery = $derived.by(() =>
		z.createQuery(listEmailMessages(appState.queryContext, draftFilter))
	);

	const sentQuery = $derived.by(() =>
		z.createQuery(listEmailMessages(appState.queryContext, sentFilter))
	);

	const drafts = $derived(draftsQuery.data ?? []);
	const sent = $derived(sentQuery.data ?? []);
</script>

<ContentLayout rootLink="/communications">
	<div class="container mx-auto max-w-6xl py-8">
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="mb-2 text-3xl font-bold">{t`Communications`}</h1>
				<p class="text-muted-foreground">{t`Manage your email campaigns and messages`}</p>
			</div>
			<Button href="/communications/drafts/email/new" data-sveltekit-preload-data="off">
				<PlusCircle class="mr-2 size-4" />
				{t`New Email`}
			</Button>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200"
							>
								<Mail class="size-5 text-blue-600" />
							</div>
							<div>
								<Card.Title>Email Drafts</Card.Title>
								<Card.Description
									>{drafts.length} draft{drafts.length === 1 ? '' : 's'}</Card.Description
								>
							</div>
						</div>
						<Button href="/communications/drafts/email" variant="ghost" size="sm">View All</Button>
					</div>
				</Card.Header>
				<Card.Content>
					{#if drafts.length === 0}
						<div class="py-8 text-center">
							<Mail class="mx-auto mb-3 size-12 text-muted-foreground" />
							<p class="text-sm text-muted-foreground">No drafts yet</p>
							<Button
								href="/communications/drafts/email/new"
								variant="link"
								size="sm"
								class="mt-2"
								data-sveltekit-preload-data="off"
							>
								Create your first draft
							</Button>
						</div>
					{:else}
						<div class="space-y-3">
							{#each drafts as draft}
								<a
									href="/communications/drafts/email/{draft.id}"
									class="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
								>
									<div class="mb-1 font-medium">
										{draft.subject || t`Untitled Draft`}
									</div>
									<div class="text-xs text-muted-foreground">
										{t`Updated`}
										{new Date(draft.updatedAt).toLocaleDateString()}
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200"
							>
								<Send class="size-5 text-green-600" />
							</div>
							<div>
								<Card.Title>{t`Sent Emails`}</Card.Title>
								<Card.Description>{sent.length} {t`sent`}</Card.Description>
							</div>
						</div>
						<Button href="/communications/sent" variant="ghost" size="sm">
							{t`View All`}
						</Button>
					</div>
				</Card.Header>
				<Card.Content>
					{#if sent.length === 0}
						<div class="py-8 text-center">
							<Send class="mx-auto mb-3 size-12 text-muted-foreground" />
							<p class="text-sm text-muted-foreground">{t`No sent emails yet`}</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each sent as email}
								<div class="rounded-lg border p-3">
									<div class="mb-1 font-medium">
										{email.subject || t`Untitled Email`}
									</div>
									<div class="flex items-center justify-between text-xs text-muted-foreground">
										<span
											>{t`Sent`}
											{new Date(email.startedAt || email.createdAt).toLocaleDateString()}</span
										>
										<span
											>{email.successfulRecipientCount} recipient{email.successfulRecipientCount ===
											1
												? ''
												: 's'}</span
										>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</ContentLayout>
