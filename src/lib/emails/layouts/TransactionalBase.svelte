<script lang="ts">
	import {
		Body,
		Container,
		Head,
		Html,
		Img,
		Link,
		Preview,
		Row,
		Section,
		Text
	} from '@better-svelte-email/components';

	import type { Snippet } from 'svelte';

	type Props = {
		previewText: string;
		children: Snippet;
		language?: string;
		instanceUrl: string;
		logoUrl: string;
		logoAlt: string;
		/** Trusted HTML containing the plain-link fallback shown below the button. */
		copyright: string;
	};

	let {
		previewText = 'This is email preview text',
		language = 'en',
		instanceUrl = 'https://example.com',
		logoUrl = 'https://belcoda-public-prod.t3.tigrisfiles.io/design/logo-belcoda-glass.png',
		logoAlt = 'Example Logo',
		children,
		copyright = `${new Date().getFullYear()} Belcoda. All rights reserved.`
	}: Props = $props();
</script>

<Html lang={language} class="sm:bg-gray-100">
	<Head>
		<title>{previewText}</title>
		<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
	</Head>
	<Body class="sm:bg-gray-100">
		<Preview preview={previewText} />

		<Container class="mx-auto w-full max-w-xl">
			<Section class="rounded-lg  bg-white mt-8 p-6 sm:px-9">
				<Row>
					<Link href={instanceUrl} aria-label={logoAlt} class="mx-auto">
						<Img
							src={logoUrl}
							alt={logoAlt}
							width="100px"
							height="auto"
							class="my-4 h-auto mx-auto"
						/>
					</Link>

					{@render children()}
				</Row>
			</Section>

			<Section class="w-full">
				<Text class="m-0 px-9 py-6 text-center text-xs leading-5 text-slate-500">
					&copy; {copyright}
				</Text>
			</Section>
		</Container>
	</Body>
</Html>
