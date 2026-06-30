export type NotificationGroupItem = {
	id: string;
	status: string | null;
	payload: unknown;
};

export type NotificationGroup = {
	key: string;
	type: string;
	referenceId: string;
	notifications: NotificationGroupItem[];
	latestAt: number | null;
	personNames: string[];
	personIds: string[];
	subjectTitle: string | null;
	hasUnread: boolean;
};
