export type NotificationGroupItem = {
	id: string;
	status: string | null;
	payload: unknown;
};

export type NotificationGroupPerson = {
	name: string;
	id: string | null;
};

export type NotificationGroup = {
	key: string;
	type: string;
	referenceId: string;
	notifications: NotificationGroupItem[];
	latestAt: number | null;
	people: NotificationGroupPerson[];
	subjectTitle: string | null;
	hasUnread: boolean;
};
