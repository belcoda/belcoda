import { describe, expect, it, vi } from 'vitest';

import { flow, flowDocument } from '$lib/schema/drizzle';
import { createFlowResource, deleteFlowResource } from './flow';
import { updateFlowDocumentDraft, FlowDraftRevisionConflictError } from './document';

const organizationId = '22222222-2222-4222-8222-222222222222';
const flowId = '33333333-3333-4333-8333-333333333333';
const flowDocumentId = '44444444-4444-4444-8444-444444444444';
const userId = '55555555-5555-4555-8555-555555555555';

const ctx = {
	userId,
	authTeams: [],
	adminOrgs: [organizationId],
	ownerOrgs: [],
	otherOrgs: []
};

// A chainable stand-in for a drizzle query builder. Terminal `.returning()` resolves `rows`, and the
// object is itself awaitable (thenable) so an update executed without `.returning()` also resolves.
function chain(rows: unknown[]) {
	const link: Record<string, unknown> = {};
	const self = () => link;
	link.set = self;
	link.values = self;
	link.where = self;
	link.returning = () => Promise.resolve(rows);
	link.then = (resolve: (v: unknown[]) => unknown) => resolve(rows);
	return link;
}

function createTransaction({
	documentRows = [],
	flowRows = [],
	draftUpdateRows = [],
	runResult
}: {
	documentRows?: unknown[];
	flowRows?: unknown[];
	draftUpdateRows?: unknown[];
	runResult?: unknown;
} = {}) {
	const insert = vi.fn((table: unknown) => chain(table === flowDocument ? documentRows : flowRows));
	const update = vi.fn((table: unknown) =>
		chain(table === flow ? flowRows : draftUpdateRows.length ? draftUpdateRows : documentRows)
	);
	const teamFindFirst = vi.fn().mockResolvedValue(undefined);
	const run = vi.fn().mockResolvedValue(runResult);

	const tx = {
		location: 'server',
		run,
		dbTransaction: {
			wrappedTransaction: {
				insert,
				update,
				query: { team: { findFirst: teamFindFirst } }
			}
		}
	};
	return { tx, insert, update, run };
}

describe('createFlowResource', () => {
	it('creates the flow_document and the owning flow with the pre-generated ids', async () => {
		const documentRow = { id: flowDocumentId, organizationId };
		const flowRow = { id: flowId, organizationId, flowDocumentId };
		const { tx, insert } = createTransaction({
			documentRows: [documentRow],
			flowRows: [flowRow]
		});

		const result = await createFlowResource({
			tx: tx as never,
			ctx,
			args: {
				input: { name: 'New flow', description: null, teamId: null },
				metadata: { organizationId, flowId, flowDocumentId }
			}
		});

		// Both the document and the flow rows are inserted.
		const insertedTables = insert.mock.calls.map((c) => c[0]);
		expect(insertedTables).toContain(flowDocument);
		expect(insertedTables).toContain(flow);
		expect(result).toBe(flowRow);
	});

	it('rejects when the user is not an admin/owner of the organization', async () => {
		const { tx } = createTransaction();
		await expect(
			createFlowResource({
				tx: tx as never,
				ctx: { ...ctx, adminOrgs: [], ownerOrgs: [] },
				args: {
					input: { name: 'New flow', description: null, teamId: null },
					metadata: { organizationId, flowId, flowDocumentId }
				}
			})
		).rejects.toThrow();
	});
});

describe('deleteFlowResource', () => {
	it('soft-deletes the flow and retires its document (executionEnabled=false)', async () => {
		const flowRow = { id: flowId, organizationId, flowDocumentId };
		const { tx, update } = createTransaction({
			flowRows: [flowRow],
			runResult: flowRow
		});

		await deleteFlowResource({
			tx: tx as never,
			ctx,
			args: { metadata: { organizationId, flowId } }
		});

		// The flow is updated (soft-delete) and the document is updated (retire).
		const updatedTables = update.mock.calls.map((c) => c[0]);
		expect(updatedTables).toContain(flow);
		expect(updatedTables).toContain(flowDocument);
	});
});

describe('updateFlowDocumentDraft (optimistic-lock CAS)', () => {
	const draftArgs = {
		input: { draftFlowDefinition: { nodes: [], edges: [] }, expectedDraftRevision: 3 },
		metadata: { organizationId, flowDocumentId }
	};

	it('saves the draft when the revision still matches', async () => {
		const savedRow = { id: flowDocumentId, organizationId, draftRevision: 4 };
		const { tx } = createTransaction({
			draftUpdateRows: [savedRow],
			runResult: { id: flowDocumentId, organizationId }
		});

		const result = await updateFlowDocumentDraft({
			tx: tx as never,
			ctx,
			args: draftArgs
		});
		expect(result).toBe(savedRow);
	});

	it('throws a conflict error when the revision has moved on', async () => {
		const { tx } = createTransaction({
			draftUpdateRows: [], // CAS matched no row → concurrent save happened
			runResult: { id: flowDocumentId, organizationId }
		});

		await expect(
			updateFlowDocumentDraft({ tx: tx as never, ctx, args: draftArgs })
		).rejects.toBeInstanceOf(FlowDraftRevisionConflictError);
	});
});
