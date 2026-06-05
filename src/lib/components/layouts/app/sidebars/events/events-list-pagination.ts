import { getContext, setContext } from 'svelte';

const EVENTS_LIST_PAGINATION_KEY = Symbol('eventsListPagination');

export type EventsListPaginationContext = {
	reset: () => void;
};

export function initEventsListPaginationContext() {
	const ctx: EventsListPaginationContext = { reset: () => {} };
	setContext(EVENTS_LIST_PAGINATION_KEY, ctx);
	return ctx;
}

export function bindEventsListPaginationReset(reset: () => void) {
	const ctx = getContext<EventsListPaginationContext | undefined>(EVENTS_LIST_PAGINATION_KEY);
	if (ctx) ctx.reset = reset;
}

export function resetEventsListPagination() {
	getContext<EventsListPaginationContext | undefined>(EVENTS_LIST_PAGINATION_KEY)?.reset();
}
