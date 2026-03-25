<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	let open = $state(true);
</script>

<div>
	<ResponsiveModal title={t`Getting started with Belcoda`} bind:open>
		<iframe
			width="100%"
			height="auto"
			src="https://www.youtube.com/embed/PIe6kR3CL6c"
			title="Belcoda orientation video"
			allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		>
		</iframe>
		<Button onclick={() => (open = false)}>{t`Close`}</Button>
	</ResponsiveModal>
</div>
