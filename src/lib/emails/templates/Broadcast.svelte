<script lang="ts" module>
	export type Props = {
		language?: string;
		body: string;
		copyright?: string;
	};
</script>

<script lang="ts">
	import BroadcastBase from '../layouts/BroadcastBase.svelte';
	import { Text } from '@better-svelte-email/components';

	let {
		language = 'en',
		body = '<p>Dear friend</p><p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>',
		copyright = `Copyright ${new Date().getFullYear()} Belcoda. All rights reserved.`
	}: Props = $props();
</script>

<BroadcastBase {language} {copyright}>
	<Text class="mt-0 mb-7 text-lg leading-7 text-slate-600">
		{@html body}
	</Text>
</BroadcastBase>
