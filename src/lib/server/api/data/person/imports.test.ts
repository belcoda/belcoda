import { beforeEach, describe, expect, it, vi } from 'vitest';

import { insertPersonImport, triggerImportQueue } from './imports';
import { getOrganizationByIdForAdminOrOwner } from '$lib/server/api/data/organization';
import { getQueue } from '$lib/server/queue';

vi.mock('$lib/server/api/data/organization', () => ({
	getOrganizationByIdForAdminOrOwner: vi.fn()
}));

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn(),
	queueSendOptionsFromTransaction: vi.fn(() => ({ tx: true }))
}));

const orgId = '11111111-1111-4111-8111-111111111111';
const otherOrgId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const forgedUserId = '44444444-4444-4444-8444-444444444444';
const importId = '55555555-5555-4555-8555-555555555555';
const csvUrl = 'https://example.com/import.csv';

function createInsertTx() {
	const returning = vi.fn();
	const values = vi.fn(() => ({ returning }));
	const insert = vi.fn(() => ({ values }));
	const tx = {
		dbTransaction: {
			wrappedTransaction: {
				insert
			}
		}
	};

	return { tx, insert, values, returning };
}

function createTriggerTx(importRecord: { id: string; organizationId: string } | undefined) {
	const findFirst = vi.fn(async () => importRecord);
	const tx = {
		dbTransaction: {
			wrappedTransaction: {
				query: {
					personImport: {
						findFirst
					}
				}
			}
		}
	};

	return { tx, findFirst };
}

describe('person imports data functions', () => {
	beforeEach(() => {
		vi.mocked(getOrganizationByIdForAdminOrOwner).mockReset();
		vi.mocked(getQueue).mockReset();
	});

	it('creates imports only after admin or owner authorization and derives importedBy from context', async () => {
		const { tx, values, returning } = createInsertTx();
		returning.mockResolvedValueOnce([
			{
				id: importId,
				organizationId: orgId,
				csvUrl,
				status: 'pending',
				totalRows: 0,
				processedRows: 0,
				failedRows: 0,
				failedEntries: null,
				importedBy: userId,
				createdAt: new Date(),
				completedAt: null
			}
		]);
		vi.mocked(getOrganizationByIdForAdminOrOwner).mockResolvedValueOnce({ id: orgId } as never);
		vi.mocked(getQueue).mockResolvedValueOnce({ triggerWebhook: vi.fn() } as never);

		await insertPersonImport({
			tx: tx as never,
			ctx: {
				userId,
				authTeams: [],
				adminOrgs: [orgId],
				ownerOrgs: [],
				otherOrgs: []
			},
			args: {
				input: { csvUrl },
				metadata: {
					organizationId: orgId,
					importId,
					importedBy: forgedUserId
				}
			}
		});

		expect(getOrganizationByIdForAdminOrOwner).toHaveBeenCalledWith({
			tx,
			ctx: expect.objectContaining({ userId }),
			organizationId: orgId
		});
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({
				id: importId,
				organizationId: orgId,
				importedBy: userId
			})
		);
	});

	it('does not insert when the requested organization is not authorized', async () => {
		const { tx, insert } = createInsertTx();
		vi.mocked(getOrganizationByIdForAdminOrOwner).mockRejectedValueOnce(
			new Error('You are not authorized to get this organization')
		);

		await expect(
			insertPersonImport({
				tx: tx as never,
				ctx: {
					userId,
					authTeams: [],
					adminOrgs: [],
					ownerOrgs: [],
					otherOrgs: []
				},
				args: {
					input: { csvUrl },
					metadata: {
						organizationId: otherOrgId,
						importId,
						importedBy: userId
					}
				}
			})
		).rejects.toThrow('not authorized');
		expect(insert).not.toHaveBeenCalled();
	});

	it('triggers the queue with the import record tenant instead of client metadata', async () => {
		const { tx } = createTriggerTx({ id: importId, organizationId: orgId });
		const importPeople = vi.fn();
		vi.mocked(getQueue).mockResolvedValueOnce({ importPeople } as never);

		await triggerImportQueue({
			tx: tx as never,
			ctx: {
				userId,
				authTeams: [],
				adminOrgs: [orgId],
				ownerOrgs: [],
				otherOrgs: []
			},
			args: {
				metadata: {
					organizationId: otherOrgId,
					importId,
					importedBy: forgedUserId
				}
			}
		});

		expect(importPeople).toHaveBeenCalledWith({
			personImportId: importId,
			organizationId: orgId
		});
	});

	it('does not trigger another tenant import', async () => {
		const { tx } = createTriggerTx({ id: importId, organizationId: otherOrgId });
		const importPeople = vi.fn();
		vi.mocked(getQueue).mockResolvedValueOnce({ importPeople } as never);

		await expect(
			triggerImportQueue({
				tx: tx as never,
				ctx: {
					userId,
					authTeams: [],
					adminOrgs: [orgId],
					ownerOrgs: [],
					otherOrgs: []
				},
				args: {
					metadata: {
						organizationId: otherOrgId,
						importId,
						importedBy: forgedUserId
					}
				}
			})
		).rejects.toThrow('not authorized');
		expect(importPeople).not.toHaveBeenCalled();
	});
});
