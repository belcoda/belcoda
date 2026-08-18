export type SetupTaskStatus = 'done' | 'active' | 'todo';

/** A single step shown in the sticky progress checklist. */
export interface SetupStep {
	id: string;
	label: string;
	status: SetupTaskStatus;
	/** Optional short meta shown under a completed/active step, e.g. "United Kingdom · Europe / London". */
	meta?: string;
}

export interface OnboardingTask {
	id: string;
	title: string;
	description?: string;
	/** Small trailing note, e.g. "30 sec". */
	hint?: string;
	/** When set, renders as a badge (e.g. "optional", "has ban risk"). */
	badge?: string;
	badgeVariant?: 'default' | 'secondary' | 'outline';
	/** 'now' = actionable button, 'later' = link-style row. */
	track: 'now' | 'later';
	status: SetupTaskStatus;
	/** Label for the action control, e.g. "Set", "Create", "Invite". */
	actionLabel?: string;
	/** Opaque action key the host can switch on (e.g. "invite", "whatsapp"). */
	action?: string;
	href?: string;
}
