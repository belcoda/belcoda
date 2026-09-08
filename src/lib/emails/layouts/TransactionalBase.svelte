<script lang="ts" module>
	export type Props = {
		previewText: string;
		children: Snippet;
		language?: string;
		instanceUrl: string;
		logoUrl?: string;
		logoAlt: string;
		copyright: string;
	};
</script>

<script lang="ts">
	import {
		Body,
		Column,
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

	let {
		previewText = 'This is email preview text',
		language = 'en',
		instanceUrl = 'https://example.com',
		logoUrl = 'https://belcoda-public-prod.t3.tigrisfiles.io/design/logo-belcoda-glass.png',
		logoAlt = 'Example Logo',
		children,
		copyright = `Copyright ${new Date().getFullYear()} Belcoda. All rights reserved.`
	}: Props = $props();
</script>

<Html lang={language} class="sm:bg-gray-100 font-sans">
	<Head>
		<title>{previewText}</title>
		<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
	</Head>
	<Body class="sm:bg-gray-100">
		<Preview preview={previewText} />

		<Container class="mx-auto w-full max-w-xl">
			<Section class="rounded-lg  bg-white mt-8 p-6 sm:px-9">
				<Row>
					<Column>
						<Link href={instanceUrl} aria-label={logoAlt} class="mx-auto">
							<Img
								src={logoUrl}
								alt={logoAlt}
								width="100px"
								height="auto"
								class="my-4 h-auto mx-auto"
							/>
						</Link>
					</Column>
				</Row>
				<Row>
					<Column>
						{@render children()}
					</Column>
				</Row>
			</Section>

			<Section class="w-full">
				<Text class="m-0 px-9 py-6 text-center text-xs leading-5 text-slate-500">
					{copyright}
				</Text>
			</Section>
		</Container>
	</Body>
</Html>
