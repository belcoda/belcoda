<script lang="ts">
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

<AuthLayout
	title={t`Hit the ground running`}
	description={t`Book a time to talk with our team, we'll give recommendations on how to make the most out of Belcoda.`}
	link="/"
>
	<div class="min-h-40">{@render calInline()}</div>
	<Separator class="mt-4" />
	<div class="mt-4 w-full">
		<Button class="w-full" href="/?display_onboarding_video=true"
			>{t`Continue to your organization`}</Button
		>

		<div class="mt-2 text-center text-xs text-muted-foreground">
			{t`If you prefer, you can continue to your organization without first booking a time.`}
		</div>
	</div>
</AuthLayout>

{#snippet calInline()}
	<!-- Cal inline embed code begins -->
	<div
		style="width:100%;height:100%;overflow:scroll"
		id="my-cal-inline-belcoda-new-organization-onboarding"
	></div>
	<script type="text/javascript">
		(function (C, A, L) {
			let p = function (a, ar) {
				a.q.push(ar);
			};
			let d = C.document;
			C.Cal =
				C.Cal ||
				function () {
					let cal = C.Cal;
					let ar = arguments;
					if (!cal.loaded) {
						cal.ns = {};
						cal.q = cal.q || [];
						d.head.appendChild(d.createElement('script')).src = A;
						cal.loaded = true;
					}
					if (ar[0] === L) {
						const api = function () {
							p(api, arguments);
						};
						const namespace = ar[1];
						api.q = api.q || [];
						if (typeof namespace === 'string') {
							cal.ns[namespace] = cal.ns[namespace] || api;
							p(cal.ns[namespace], ar);
							p(cal, ['initNamespace', namespace]);
						} else p(cal, ar);
						return;
					}
					p(cal, ar);
				};
		})(window, 'https://app.cal.com/embed/embed.js', 'init');
		Cal('init', 'belcoda-new-organization-onboarding', { origin: 'https://app.cal.com' });

		Cal.ns['belcoda-new-organization-onboarding']('inline', {
			elementOrSelector: '#my-cal-inline-belcoda-new-organization-onboarding',
			config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
			calLink: 'belcoda/belcoda-new-organization-onboarding'
		});

		Cal.ns['belcoda-new-organization-onboarding']('ui', {
			hideEventTypeDetails: false,
			layout: 'month_view'
		});
	</script>
	<!-- Cal inline embed code ends -->
{/snippet}
