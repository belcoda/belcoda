<script lang="ts">
	import NavUser from '$lib/components/layouts/app/navigation/UserMenu.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
	import OrgMenu from '$lib/components/layouts/app/navigation/OrgMenu.svelte';
	import { t } from '$lib/index.svelte';
</script>

<Sidebar.Root
	collapsible="none"
	class="hidden w-[calc(var(--sidebar-width-icon)+25px)]! border-r bg-gray-800 px-0.5 md:flex"
>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<OrgMenu />
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu class="space-y-0.5">
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContentProps={{
								hidden: false,
								class: 'bg-background text-foreground shadow-md border border',
								arrowClasses: 'bg-background text-foreground shadow-md border-r border-b'
							}}
							class="flex size-12 items-center justify-center transition-transform hover:scale-110 hover:bg-gray-700 data-[state=open]:scale-110"
						>
							{#snippet tooltipContent()}
								<span class="text-base">{t`Community`}</span>
							{/snippet}
							{#snippet child({ props })}
								<a href="/community" {...props}
									><span class="icon-[lucide--users] size-6 text-sidebar-primary-foreground"></span>
									<span class="sr-only">{t`Community`}</span></a
								>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContentProps={{
								hidden: false,
								class: 'bg-background text-foreground shadow-md border border',
								arrowClasses: 'bg-background text-foreground shadow-md border-r border-b'
							}}
							class="flex size-12 items-center justify-center transition-transform hover:scale-110 hover:bg-gray-700 data-[state=open]:scale-110"
						>
							{#snippet tooltipContent()}
								<span class="text-base">{t`Communications`}</span>
							{/snippet}
							{#snippet child({ props })}
								<a href="/communications" {...props}
									><span
										class="mt-0.5 icon-[flowbite--messages-outline] size-7 text-sidebar-primary-foreground"
									></span>
									<span class="sr-only">{t`Communications`}</span></a
								>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContentProps={{
								hidden: false,
								class: 'bg-background text-foreground shadow-md border border',
								arrowClasses: 'bg-background text-foreground shadow-md border-r border-b'
							}}
							class="flex size-12 items-center justify-center transition-transform hover:scale-110 hover:bg-gray-700 data-[state=open]:scale-110"
						>
							{#snippet tooltipContent()}
								<span class="text-base">{t`Events`}</span>
							{/snippet}
							{#snippet child({ props })}
								<a href="/events" {...props}>
									<span class="icon-[mdi--events] size-5 text-sidebar-primary-foreground"></span>
									<span class="sr-only">{t`Events`}</span></a
								>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContentProps={{
								hidden: false,
								class: 'bg-background text-foreground shadow-md border border',
								arrowClasses: 'bg-background text-foreground shadow-md border-r border-b'
							}}
							class="flex size-12 items-center justify-center transition-transform hover:scale-110 hover:bg-gray-700 data-[state=open]:scale-110"
						>
							{#snippet tooltipContent()}
								<span class="text-base">{t`Petitions`}</span>
							{/snippet}
							{#snippet child({ props })}
								<a href="/petitions" {...props}>
									<span class="icon-[mage--zap] size-7 text-sidebar-primary-foreground"></span>
									<span class="sr-only">{t`Petitions`}</span></a
								>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<NavUser />
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
