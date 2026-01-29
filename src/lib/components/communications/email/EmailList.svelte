<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import FileIcon from '@lucide/svelte/icons/file';
	import Send from '@lucide/svelte/icons/send';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEmailMessages } from '$lib/zero/query/email_message/list';
	import { formatShortTimestamp } from '$lib/utils/date';

    const { folder }: { folder?: string } = $props();
    
    const activeItem = $derived.by(() => {
        switch (folder) {
            case 'sent':
                return {
                    title: 'Sent',
                    icon: Send,
                    isDraft: false
                };
            case 'drafts':
                return {
                    title: 'Drafts',
                    icon: FileIcon,
                    isDraft: true
                };
            default:
                return {
                    title: 'Drafts',
                    icon: FileIcon,
                    isDraft: true
                };
        }
    });

    const emailFilter = $derived.by(() => ({
        ...getListFilter(appState.organizationId),
        isDraft: activeItem.isDraft
    }));

    const emailsQuery = $derived.by(() =>
        z.createQuery(listEmailMessages(appState.queryContext, emailFilter))
    );

    const emails = $derived(emailsQuery.data ?? []);

    function getRecipientDisplay(email: typeof emails[0]) {
        const count = email.estimatedRecipientCount;
        if (count === 1) {
            // For single recipient, we'd need to fetch the actual recipient name
            // For now, show "1 recipient"
            return '1 recipient';
        }
        return `${count} recipients`;
    }
</script>
<div class="flex w-full flex-col bg-background md:w-[300px] md:shrink-0">
    <div class="flex flex-col gap-3 border-b p-4">
      <div class="flex w-full items-center justify-between">
        <div class="text-xl font-semibold text-foreground">
          {activeItem.title}
        </div>
      </div>
      <input type="search" placeholder="Type to search..." class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
    </div>
    <div class="flex-1 overflow-auto">
      <div class="flex flex-col">
        {#each emails as email (email.id)}
          <a
            href="/communications/email/{folder}/{email.id}"
            class="hover:bg-muted flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0"
          >
            <div class="flex w-full items-center gap-2">
              <span>{getRecipientDisplay(email)}</span>
              <span class="ms-auto text-xs text-muted-foreground">{formatShortTimestamp(email.updatedAt)}</span>
            </div>
            <span class="font-medium">{email.subject || '(No subject)'}</span>
            {#if email.previewTextOverride}
              <span class="line-clamp-2 text-xs text-muted-foreground">
                {email.previewTextOverride}
              </span>
            {/if}
          </a>
        {:else}
          <div class="flex flex-col items-center justify-center p-8 text-center">
            <p class="text-sm text-muted-foreground">No emails found</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
