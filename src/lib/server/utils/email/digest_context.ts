import type { NotificationPayload } from '$lib/schema/notification/payload';

export type DigestItem = {
	title: string;
	detail: string;
	url: string;
};

export type DigestSection = {
	label: string;
	count: number;
	items: DigestItem[];
};

export type DigestContext = {
	organizationName: string;
	weekOf: string;
	totalCount: number;
	sections: DigestSection[];
	appUrl: string;
};

type NotificationRow = {
	id: string;
	type: string;
	referenceId: string;
	payload: unknown;
};

type GroupedNotification = {
	key: string;
	type: string;
	referenceId: string;
	people: { name: string; id: string | null }[];
	fallbackPersonId: string | null;
	subjectTitle: string | null;
	noteAuthorName: string | null;
	notePreview: string | null;
	count: number;
};

function groupKey(n: NotificationRow): string {
	const payload = n.payload as NotificationPayload | null;
	switch (n.type) {
		case 'whatsapp_message':
		case 'whatsapp_unread':
			return `whatsapp:${payload?.personId ?? n.id}`;
		case 'generic':
			return n.id;
		default:
			return `${n.type}:${n.referenceId}`;
	}
}

function groupNotifications(notifications: NotificationRow[]): GroupedNotification[] {
	const map = new Map<string, GroupedNotification>();

	for (const n of notifications) {
		const key = groupKey(n);
		const payload = n.payload as NotificationPayload | null;

		if (!map.has(key)) {
			map.set(key, {
				key,
				type: n.type,
				referenceId: n.referenceId,
				people: [],
				fallbackPersonId: payload?.personId ?? null,
				subjectTitle: payload?.subjectTitle ?? null,
				noteAuthorName: payload?.noteAuthorName ?? null,
				notePreview: payload?.notePreview ?? null,
				count: 0
			});
		}

		const group = map.get(key)!;
		group.count++;

		const name = payload?.personName;
		const pid = payload?.personId ?? null;
		if (!group.fallbackPersonId && pid) {
			group.fallbackPersonId = pid;
		}
		if (name) {
			const existing = group.people.find((p) => p.id === pid || p.name === name);
			if (existing) {
				existing.id ??= pid;
			} else {
				group.people.push({ name, id: pid });
			}
		}
	}

	return [...map.values()];
}

function formatPeople(people: { name: string }[], verb: string): string {
	if (people.length === 0) return `New ${verb}`;
	if (people.length === 1) return `${people[0].name} ${verb}`;
	if (people.length === 2) return `${people[0].name} and ${people[1].name} ${verb}`;
	const extra = people.length - 2;
	return `${people[0].name}, ${people[1].name}, and ${extra} other${extra === 1 ? '' : 's'} ${verb}`;
}

function buildAppUrl(appUrl: string, path: string, organizationId: string): string {
	const url = new URL(path, appUrl);
	url.searchParams.set('org', organizationId);
	return url.toString();
}

export function buildDigestContext(options: {
	notifications: NotificationRow[];
	organizationName: string;
	organizationId: string;
	weekOf: string;
	appUrl: string;
}): DigestContext {
	const { notifications, organizationName, organizationId, weekOf, appUrl } = options;
	const groups = groupNotifications(notifications);

	const sectionMap = new Map<string, { label: string; items: DigestItem[] }>();

	for (const group of groups) {
		let sectionKey: string;
		let sectionLabel: string;
		let item: DigestItem;

		switch (group.type) {
			case 'event_signup': {
				sectionKey = 'event_signup';
				sectionLabel = 'Event signups';
				item = {
					title: group.subjectTitle ?? 'Event',
					detail: formatPeople(group.people, 'signed up'),
					url: buildAppUrl(appUrl, `/events/${group.referenceId}`, organizationId)
				};
				break;
			}
			case 'petition_signup': {
				sectionKey = 'petition_signup';
				sectionLabel = 'Petition signatures';
				item = {
					title: group.subjectTitle ?? 'Petition',
					detail: formatPeople(group.people, 'signed'),
					url: buildAppUrl(appUrl, `/petitions/${group.referenceId}`, organizationId)
				};
				break;
			}
			case 'whatsapp_message':
			case 'whatsapp_unread': {
				sectionKey = 'whatsapp';
				sectionLabel = 'WhatsApp messages';
				const person = group.people[0];
				const personId = person?.id ?? group.fallbackPersonId;
				const personUrl = personId
					? buildAppUrl(appUrl, `/community/${personId}`, organizationId)
					: buildAppUrl(appUrl, '/notifications', organizationId);
				item = {
					title: person?.name ?? 'WhatsApp contact',
					detail: `${group.count} new message${group.count === 1 ? '' : 's'}`,
					url: personUrl
				};
				break;
			}
			case 'person_note_mention': {
				sectionKey = 'person_note_mention';
				sectionLabel = 'Note mentions';
				const person = group.people[0];
				const personId = person?.id ?? group.fallbackPersonId;
				const personUrl = personId
					? buildAppUrl(appUrl, `/community/${personId}#note-${group.referenceId}`, organizationId)
					: buildAppUrl(appUrl, '/notifications', organizationId);
				item = {
					title: person?.name ?? 'Note mention',
					detail: `${group.noteAuthorName ?? 'A teammate'} mentioned you in a note${group.notePreview ? `: ${group.notePreview}` : ''}`,
					url: personUrl
				};
				break;
			}
			default: {
				sectionKey = 'other';
				sectionLabel = 'Notifications';
				item = {
					title: group.subjectTitle ?? 'Notification',
					detail: '',
					url: buildAppUrl(appUrl, '/notifications', organizationId)
				};
			}
		}

		if (!sectionMap.has(sectionKey)) {
			sectionMap.set(sectionKey, { label: sectionLabel, items: [] });
		}
		sectionMap.get(sectionKey)!.items.push(item);
	}

	const sections: DigestSection[] = [...sectionMap.values()].map((s) => ({
		label: s.label,
		count: s.items.length,
		items: s.items
	}));

	return {
		organizationName,
		weekOf,
		totalCount: notifications.length,
		sections,
		appUrl
	};
}
