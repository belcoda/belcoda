<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { cookieConsent } from '$lib/state/cookieConsent.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

{#if !cookieConsent.decided}
	<div
		class="fixed right-4 bottom-4 z-50 max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-lg"
		role="dialog"
		aria-modal="true"
		aria-labelledby="cookie-banner-title"
	>
		<h3 id="cookie-banner-title" class="mb-2 font-semibold">{t`Cookie Preferences`}</h3>
		<p class="mb-4 text-sm text-muted-foreground">
			{t`We use cookies to improve your experience. Necessary cookies are always on. You can accept all cookies or only necessary ones.`}
		</p>
		<div class="flex gap-3">
			<Button variant="default" onclick={() => cookieConsent.accept()} class="flex-1">
				{t`Accept all`}
			</Button>
			<Button variant="outline" onclick={() => cookieConsent.reject()} class="flex-1">
				{t`Only necessary`}
			</Button>
		</div>
	</div>
{/if}
