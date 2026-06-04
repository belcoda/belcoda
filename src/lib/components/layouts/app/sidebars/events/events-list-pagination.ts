import { getContext, setContext } from 'svelte';

const EVENTS_LIST_PAGINATION_KEY = Symbol('eventsListPagination');

export type EventsListPaginationContext = {
	reset: () => void;
};

export function setEventsListPaginationContext(ctx: EventsListPaginationContext) {
	setContext(EVENTS_LIST_PAGINATION_KEY, ctx);
}

export function resetEventsListPagination() {
	getContext<EventsListPaginationContext | undefined>(EVENTS_LIST_PAGINATION_KEY)?.reset();
}
