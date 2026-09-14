import { describe, expect, it } from 'vitest';
import { renderer } from '$lib/server/utils/email/transactional/renderer';
import NotificationDigest from './NotificationDigest.svelte';
import type { Props } from './NotificationDigest.svelte';

const baseProps: Props = {
	previewText: '2 notifications from Declic',
	appUrl: 'https://app.belcoda.com',
	logoAlt: 'Belcoda logo',
	eyebrow: 'Notification digest',
	heading: '2 notifications',
	organizationName: 'Declic',
	weekOf: 'Aug 27 – Sep 2, 2026',
	allNotificationsUrl: 'https://app.belcoda.com/notifications',
	ctaText: 'View all notifications',
	viewText: 'View',
	unsubscribeText: "You're receiving this because you have unread notifications in Belcoda.",
	unsubscribeLinkText: 'Unsubscribe',
	copyright: 'Copyright 2026 Belcoda',
	sections: [
		{
			label: 'WhatsApp messages',
			count: 1,
			items: [
				{
					title: 'Mihai Badulescu',
					detail: '4 new messages',
					url: 'https://app.belcoda.com/community/1?org=abc'
				}
			]
		},
		{
			label: 'Event signups',
			count: 1,
			items: [
				{ title: 'Community picnic', detail: '', url: 'https://app.belcoda.com/events/9?org=abc' }
			]
		}
	]
};

describe('NotificationDigest', () => {
	it('renders the summary heading, period and section content', async () => {
		const html = await renderer.render(NotificationDigest, { props: baseProps });

		expect(html).toContain('2 notifications');
		expect(html).toContain('Declic · Aug 27 – Sep 2, 2026');
		expect(html).toContain('WhatsApp messages');
		expect(html).toContain('Mihai Badulescu');
		expect(html).toContain('4 new messages');
		expect(html).toContain('https://app.belcoda.com/community/1?org=abc');
		expect(html).toContain('View all notifications');
	});

	it('uses the Postmark unsubscribe token as the unsubscribe link href', async () => {
		const html = await renderer.render(NotificationDigest, { props: baseProps });

		expect(html).toContain('href="{{{pm:unsubscribe}}}"');
		expect(html).toContain('Unsubscribe');
	});
});
