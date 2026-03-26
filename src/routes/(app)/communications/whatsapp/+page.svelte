<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
</script>

<ContentLayout rootLink="/communications">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UserSearchIcon />
			</Empty.Media>
			<Empty.Title>{t`No WhatsApp Drafts Yet`}</Empty.Title>
			<Empty.Description>
				{t`You haven't created any WhatsApp drafts yet. Get started by creating your first WhatsApp draft.`}
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<div class="flex gap-2">
				<Button href="/communications/whatsapp/drafts/new">{t`Create WhatsApp Draft`}</Button>
			</div>
		</Empty.Content>
	</Empty.Root>
</ContentLayout>
