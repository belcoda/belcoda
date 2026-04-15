<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
</script>

<ContentLayout rootLink="/events">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UserSearchIcon />
			</Empty.Media>
			<Empty.Title>{t`Events`}</Empty.Title>
			<Empty.Description>
				{t`Create events to track your team's activities and progress.`}
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button href="/events/new" data-testid="events-create-button">{t`Create event`}</Button>
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<a href="#/">
				{t`Learn more about events`}
				<ExternalLinkIcon class="inline" />
			</a>
		</Button>
	</Empty.Root>
</ContentLayout>
