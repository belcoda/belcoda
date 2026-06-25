<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import NotificationBell from '$lib/components/widgets/notifications/NotificationBell.svelte';
	import RecentNotifications from '$lib/components/widgets/notifications/RecentNotifications.svelte';
	import NextEventCard from '$lib/components/widgets/event/NextEventCard.svelte';
	import UpcomingEventsList from '$lib/components/widgets/event/UpcomingEventsList.svelte';
	import DashboardMetrics from '$lib/components/widgets/dashboard/DashboardMetrics.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { appState } from '$lib/state.svelte';

	const today = new Date();
	const greeting = (() => {
		const h = today.getHours();
		if (h < 12) return 'Good morning';
		if (h < 18) return 'Good afternoon';
		return 'Good evening';
	})();

	const userName = $derived(appState.user.data?.name?.split(' ')[0] ?? '');

	const dateLabel = today.toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="min-h-full bg-background">
	<div class="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
		<header class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-xl font-medium text-foreground">
					{greeting}{userName ? `, ${userName}` : ''}
				</h1>
				<p class="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
			</div>
			<div class="flex items-center gap-2">
				<!-- <NotificationBell /> -->
				<Button href="/events/new" size="sm">
					<PlusIcon class="size-4" />
					New event
				</Button>
			</div>
		</header>

		<DashboardMetrics />

		<NextEventCard />

		<section class="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
			<UpcomingEventsList />
			<RecentNotifications />
		</section>
	</div>
</div>
