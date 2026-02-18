<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import NewUserIcon from '@lucide/svelte/icons/user-plus';
	import { t } from '$lib/index.svelte';
</script>

<Button variant="outline" size="icon" href="/community/person/new">
	<NewUserIcon class="size-5" />
</Button>
