import type { ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';

export type PersonContextPanelState =
	| { status: 'loading' }
	| { status: 'error' }
	| { status: 'not-found' }
	| { status: 'forbidden' }
	| {
			status: 'ready';
			person: ReadPersonOutputWithReadonlyArrays;
	  };
