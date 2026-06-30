export type NotificationGroup = {
	key: string;
	type: string;
	referenceId: string;
	notifications: { id: string; status: string }[];
	latestAt: number | null;
	personNames: string[];
	personIds: string[];
	subjectTitle: string | null;
	hasUnread: boolean;
};
