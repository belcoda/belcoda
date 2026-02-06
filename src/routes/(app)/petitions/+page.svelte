<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import BookAlertIcon from '@lucide/svelte/icons/book-alert';
</script>

<ContentLayout rootLink="/petitions">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<BookAlertIcon />
			</Empty.Media>
			<Empty.Title>{t`Petitions`}</Empty.Title>
			<Empty.Description>
				{t`Create petitions and collect signatures from your community.`}
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button href="/petitions/new">{t`Create petition`}</Button>
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<a href="#/">
				{t`Learn more about petitions`} <ExternalLinkIcon class="inline" />
			</a>
		</Button>
	</Empty.Root>
</ContentLayout>
