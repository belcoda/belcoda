<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import EmbeddedFlow from './EmbeddedFlow.svelte';
</script>

<ContentLayout rootLink="/settings">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">{t`WhatsApp Business Account`}</h1>
		</div>
	{/snippet}
	<EmbeddedFlow />
</ContentLayout>
