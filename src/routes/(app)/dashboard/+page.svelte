<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import UsersIcon from '@lucide/svelte/icons/users';

	const summaryMetrics = [
		{ label: 'People reached', value: '18,420', change: '+12.4%', tone: 'text-emerald-700' },
		{ label: 'Active supporters', value: '7,812', change: '+4.8%', tone: 'text-emerald-700' },
		{ label: 'Unread items', value: '36', change: '8 urgent', tone: 'text-amber-700' },
		{ label: 'Conversion rate', value: '22.6%', change: '+2.1%', tone: 'text-emerald-700' }
	];

	const upcomingEvents = [
		{
			name: 'Climate briefing: Central Ward',
			time: 'Today, 18:30',
			status: 'Next',
			signups: 184,
			capacity: 220,
			waitlist: 14
		},
		{
			name: 'Volunteer onboarding call',
			time: 'Tomorrow, 09:00',
			status: 'Upcoming',
			signups: 62,
			capacity: 80,
			waitlist: 0
		},
		{
			name: 'Canvassing launch: North District',
			time: 'Fri, 16:00',
			status: 'Upcoming',
			signups: 128,
			capacity: 150,
			waitlist: 6
		}
	];

	const eventFunnel = [
		{ label: 'Invited', value: 12800, percent: 100 },
		{ label: 'Viewed', value: 6420, percent: 50 },
		{ label: 'Signed up', value: 1480, percent: 23 },
		{ label: 'Attended', value: 964, percent: 15 }
	];

	const eventTypes = [
		{ label: 'Briefings', value: '48%', color: 'bg-teal-600' },
		{ label: 'Volunteer calls', value: '31%', color: 'bg-sky-600' },
		{ label: 'Canvassing', value: '21%', color: 'bg-amber-600' }
	];

	const sourceRows = [
		{ source: 'WhatsApp broadcast', signups: 612, conversion: '31%' },
		{ source: 'Email campaign', signups: 408, conversion: '18%' },
		{ source: 'Public page', signups: 284, conversion: '12%' },
		{ source: 'Manual invite', signups: 176, conversion: '27%' }
	];

	const insights = [
		'Reminder messages sent 24 hours before an event are producing the highest attendance rate.',
		'Central Ward events are filling faster than capacity; consider adding a second session.',
		'First-time attendees are more likely to show up when they receive a WhatsApp confirmation.'
	];

	const notifications = [
		{
			title: 'Next event is 84% full',
			meta: 'Climate briefing has 36 seats remaining and 14 people on the waitlist.',
			time: '12 min ago',
			kind: 'Events'
		},
		{
			title: 'Reminder digest ready',
			meta: 'Two upcoming events have reminder messages scheduled for tomorrow morning.',
			time: '43 min ago',
			kind: 'Digest'
		},
		{
			title: 'Follow-up queue growing',
			meta: '18 attendees from last week still need a post-event message.',
			time: '2 hr ago',
			kind: 'Comms'
		}
	];
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="min-h-full bg-background">
	<div class="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
		<header class="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="text-sm font-medium text-muted-foreground">Events dashboard mock</p>
				<h1 class="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
					Dashboard
				</h1>
			</div>
			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary">Sample data</Badge>
				<Badge variant="outline">No live queries</Badge>
			</div>
		</header>

		<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each summaryMetrics as metric}
				<Card.Root class="rounded-md">
					<Card.Header class="pb-2">
						<Card.Description>{metric.label}</Card.Description>
						<Card.Title class="text-2xl">{metric.value}</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="flex items-center gap-2 text-sm">
							<TrendingUpIcon class="size-4 {metric.tone}" />
							<span class={metric.tone}>{metric.change}</span>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</section>

		<section class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
			<Card.Root class="overflow-hidden rounded-md">
				<Card.Header class="border-b bg-muted/30">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<Card.Description>Next event</Card.Description>
							<Card.Title class="mt-1 text-2xl">Climate briefing: Central Ward</Card.Title>
						</div>
						<Badge class="w-fit">Starts in 3h 20m</Badge>
					</div>
				</Card.Header>
				<Card.Content class="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
					<div class="space-y-5">
						<div class="grid gap-3 sm:grid-cols-3">
							<div class="rounded-md border p-3">
								<p class="text-sm text-muted-foreground">Signups</p>
								<p class="mt-1 text-2xl font-semibold">184 / 220</p>
							</div>
							<div class="rounded-md border p-3">
								<p class="text-sm text-muted-foreground">Expected turnout</p>
								<p class="mt-1 text-2xl font-semibold">147</p>
							</div>
							<div class="rounded-md border p-3">
								<p class="text-sm text-muted-foreground">Waitlist</p>
								<p class="mt-1 text-2xl font-semibold">14</p>
							</div>
						</div>

						<div>
							<div class="mb-2 flex items-center justify-between text-sm">
								<span class="font-medium">Capacity filled</span>
								<span class="text-muted-foreground">84%</span>
							</div>
							<div class="h-2 rounded-full bg-muted">
								<div class="h-2 w-[84%] rounded-full bg-teal-600"></div>
							</div>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							<div class="flex gap-3 rounded-md bg-emerald-50 p-3 text-emerald-950">
								<CheckCircle2Icon class="mt-0.5 size-5 shrink-0 text-emerald-700" />
								<p class="text-sm">Reminder sequence is scheduled and venue capacity is healthy.</p>
							</div>
							<div class="flex gap-3 rounded-md bg-amber-50 p-3 text-amber-950">
								<CircleAlertIcon class="mt-0.5 size-5 shrink-0 text-amber-700" />
								<p class="text-sm">
									The waitlist is growing; consider a second session or overflow stream.
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-md border p-4">
						<p class="text-sm font-medium">Attendee mix</p>
						<div class="mt-4 space-y-4">
							<div>
								<div class="mb-1 flex justify-between text-sm">
									<span>Returning</span>
									<span class="text-muted-foreground">58%</span>
								</div>
								<div class="h-2 rounded-full bg-muted">
									<div class="h-2 w-[58%] rounded-full bg-sky-600"></div>
								</div>
							</div>
							<div>
								<div class="mb-1 flex justify-between text-sm">
									<span>First-time</span>
									<span class="text-muted-foreground">42%</span>
								</div>
								<div class="h-2 rounded-full bg-muted">
									<div class="h-2 w-[42%] rounded-full bg-amber-600"></div>
								</div>
							</div>
							<div class="border-t pt-4 text-sm text-muted-foreground">
								First-time attendee share is 9 points higher than your 30-day average.
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Upcoming and ongoing</Card.Title>
					<Card.Description>Events that need attention soon.</Card.Description>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-3">
						{#each upcomingEvents as event}
							<li class="rounded-md border p-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{event.name}</p>
										<p class="mt-1 text-sm text-muted-foreground">{event.time}</p>
									</div>
									<Badge variant={event.status === 'Next' ? 'default' : 'outline'}
										>{event.status}</Badge
									>
								</div>
								<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
									<span>{event.signups} signups</span>
									<span>{event.capacity} capacity</span>
									<span>{event.waitlist} waitlist</span>
								</div>
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>
		</section>

		<section class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)]">
			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Event signup trend</Card.Title>
					<Card.Description>New signups across the last 12 weeks.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex h-72 items-end gap-3 border-b border-l px-4 pb-4">
						{#each [42, 56, 49, 74, 68, 91, 86, 108, 97, 124, 116, 142] as height, index}
							<div class="flex flex-1 flex-col items-center gap-2">
								<div
									class="w-full rounded-t bg-teal-600/85"
									style={`height: ${height * 1.35}px`}
								></div>
								<span class="text-xs text-muted-foreground">{index + 1}</span>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Event funnel</Card.Title>
					<Card.Description>Where people move from invitation to attendance.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#each eventFunnel as step}
						<div>
							<div class="mb-2 flex items-center justify-between gap-3">
								<span class="text-sm font-medium">{step.label}</span>
								<span class="text-sm text-muted-foreground">{step.value.toLocaleString()}</span>
							</div>
							<div class="h-2 rounded-full bg-muted">
								<div class="h-2 rounded-full bg-sky-600" style={`width: ${step.percent}%`}></div>
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		</section>

		<section
			class="grid gap-4 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1fr)_minmax(340px,0.85fr)]"
		>
			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Event mix</Card.Title>
					<Card.Description>Which event formats are driving activity.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#each eventTypes as type}
						<div>
							<div class="mb-2 flex items-center justify-between">
								<span class="text-sm font-medium">{type.label}</span>
								<span class="text-sm text-muted-foreground">{type.value}</span>
							</div>
							<div class="h-2 rounded-full bg-muted">
								<div class="h-2 rounded-full {type.color}" style={`width: ${type.value}`}></div>
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>

			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Signup sources</Card.Title>
					<Card.Description>Channels creating event commitments.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b text-left text-muted-foreground">
									<th class="py-2 font-medium">Source</th>
									<th class="py-2 font-medium">Signups</th>
									<th class="py-2 font-medium">Conversion</th>
								</tr>
							</thead>
							<tbody>
								{#each sourceRows as row}
									<tr class="border-b last:border-b-0">
										<td class="py-3 font-medium">{row.source}</td>
										<td class="py-3 text-muted-foreground">{row.signups}</td>
										<td class="py-3 text-muted-foreground">{row.conversion}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Notifications digest</Card.Title>
					<Card.Description>Event-related alerts and operational summaries.</Card.Description>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-3">
						{#each notifications as notification}
							<li class="flex gap-3 rounded-md border p-3">
								<div
									class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800"
								>
									<BellIcon class="size-4" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-2">
										<p class="truncate text-sm font-medium">{notification.title}</p>
										<span class="shrink-0 text-xs text-muted-foreground">{notification.time}</span>
									</div>
									<p class="mt-1 text-sm text-muted-foreground">{notification.meta}</p>
									<Badge variant="outline" class="mt-2">{notification.kind}</Badge>
								</div>
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>
		</section>

		<section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.6fr)]">
			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Event insights</Card.Title>
					<Card.Description
						>Mocked recommendations this dashboard could generate from event data.</Card.Description
					>
				</Card.Header>
				<Card.Content>
					<ul class="grid gap-3">
						{#each insights as insight}
							<li class="flex gap-3 rounded-md border p-3">
								<CheckCircle2Icon class="mt-0.5 size-5 shrink-0 text-emerald-700" />
								<span class="text-sm">{insight}</span>
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>

			<Card.Root class="rounded-md">
				<Card.Header>
					<Card.Title>Supporting activity</Card.Title>
					<Card.Description>Extras that feed the events workflow.</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-3">
					<div class="flex items-center gap-3 rounded-md border p-3">
						<UsersIcon class="size-5 text-sky-700" />
						<div>
							<p class="text-sm font-medium">392 new people</p>
							<p class="text-xs text-muted-foreground">Added through event forms this month</p>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-md border p-3">
						<MegaphoneIcon class="size-5 text-teal-700" />
						<div>
							<p class="text-sm font-medium">4 campaign audiences</p>
							<p class="text-xs text-muted-foreground">Ready for event invitation sends</p>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-md border p-3">
						<CalendarDaysIcon class="size-5 text-amber-700" />
						<div>
							<p class="text-sm font-medium">7 follow-up tasks</p>
							<p class="text-xs text-muted-foreground">Generated from recent attendance</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</section>
	</div>
</div>
