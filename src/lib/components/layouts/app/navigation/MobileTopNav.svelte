<script lang="ts">
	import OrgMenu from '$lib/components/layouts/app/navigation/OrgMenu.svelte';
	import UserMenu from '$lib/components/layouts/app/navigation/UserMenu.svelte';
</script>

<div class=" flex w-full items-center justify-between border-b border-gray-500 bg-gray-800 p-2">
	<div class="m-0.5 w-16"><OrgMenu /></div>
	<div class="m-0.5 w-16"><UserMenu /></div>
</div>
