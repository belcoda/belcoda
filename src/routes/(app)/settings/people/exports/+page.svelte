<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
</script>

<ContentLayout rootLink="/settings">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<DownloadIcon />
			</Empty.Media>
			<Empty.Title>{t`Exports`}</Empty.Title>
			<Empty.Description
				>{t`Exports are not currently supported, but will be added in a future update. `}</Empty.Description
			>
		</Empty.Header>
	</Empty.Root>
</ContentLayout>
