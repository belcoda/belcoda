<script lang="ts">
	import OrgMenu from '$lib/components/layouts/app/navigation/OrgMenu.svelte';
	import UserMenu from '$lib/components/layouts/app/navigation/UserMenu.svelte';
	// import NotificationBell from '$lib/components/widgets/notifications/NotificationBell.svelte';
</script>

<div class=" flex w-full items-center justify-between border-b border-gray-500 bg-gray-800 p-2">
	<div class="m-0.5 w-16"><OrgMenu /></div>
	<div class="m-0.5 flex items-center gap-1">
		<!-- <NotificationBell class="text-sidebar-primary-foreground hover:bg-gray-700" /> -->
		<div class="w-16"><UserMenu /></div>
	</div>
</div>
