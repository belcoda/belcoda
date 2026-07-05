import { person } from '$lib/schema/drizzle';
import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { v7 as uuidv7 } from 'uuid';
import { createPerson } from '$lib/schema/person';
import { parse as valibotParse } from 'valibot';
import type { PersonAddedFrom } from '$lib/schema/person/meta';
import { and, eq, or, isNull, type SQL } from 'drizzle-orm';
import Papa from 'papaparse';
import { mapCsvRowToPerson, providedFields, type CsvRow } from './csv-map';

const log = pino(import.meta.url);

interface ImportResult {
	totalRows: number;
	successCount: number;
	failedCount: number;
	failedRows: { row: number; error: string; data?: CsvRow }[];
}

export async function parseImportCsv({
	csvString,
	organizationId,
	addedFrom,
	upsert = false
}: {
	csvString: string;
	organizationId: string;
	addedFrom: PersonAddedFrom;
	upsert?: boolean;
}): Promise<ImportResult> {
	const records: Array<{ csvRow: CsvRow; line: number }> = [];
	let successCount = 0;
	let failedCount = 0;
	const failedRows: { row: number; error: string; data?: CsvRow }[] = [];
	const parsed = Papa.parse(csvString, { header: true });
	log.debug({ numRows: parsed.data.length }, 'Parsed CSV');
	if (parsed.errors.length > 0) {
		log.error({ errors: parsed.errors }, 'CSV parsing errors');
	}
	for (const [index, row] of parsed.data.entries()) {
		const isEntirelyEmptyRow = Object.values(row as Record<string, string>).every(
			(value) => value === null || value === undefined || String(value).trim() === ''
		);

		if (!isEntirelyEmptyRow) {
			// Line 1 is the header; first data row is line 2.
			records.push({ csvRow: row as CsvRow, line: index + 2 });
		}
	}

	log.debug({ rowCount: records.length }, 'CSV parsing completed');

	for (let i = 0; i < records.length; i++) {
		const { csvRow, line } = records[i];

		try {
			// Map + validate against the create schema. Because country is required on
			// every row, this always yields canonical identifiers we can match on.
			const personInput = mapCsvRowToPerson(csvRow);
			const validated = valibotParse(createPerson, personInput);

			// If we're upserting, look for an existing person by canonical email/phone.
			let existing: typeof person.$inferSelect | undefined = undefined;
			if (upsert && (validated.emailAddress || validated.phoneNumber)) {
				const whereConditions: SQL[] = [];
				if (validated.emailAddress) {
					whereConditions.push(eq(person.emailAddress, validated.emailAddress));
				}
				if (validated.phoneNumber) {
					whereConditions.push(eq(person.phoneNumber, validated.phoneNumber));
				}
				existing = await drizzle.query.person.findFirst({
					where: and(
						or(...whereConditions),
						eq(person.organizationId, organizationId),
						isNull(person.deletedAt)
					)
				});
			}

			try {
				if (existing) {
					// Merge update: only touch columns this row actually supplied, so an
					// omitted/blank cell never clobbers an existing value with null.
					const patch: Partial<typeof person.$inferInsert> = {};
					for (const field of providedFields(csvRow)) {
						(patch as Record<string, unknown>)[field] = (validated as Record<string, unknown>)[
							field
						];
					}
					await drizzle
						.update(person)
						.set({ ...patch, updatedAt: new Date() })
						.where(
							and(
								eq(person.id, existing.id),
								eq(person.organizationId, organizationId),
								isNull(person.deletedAt)
							)
						);
					successCount++;
					log.debug({ row: line }, 'Person updated successfully');
				} else {
					await drizzle.insert(person).values({
						...validated,
						id: uuidv7(),
						organizationId,
						addedFrom,
						mostRecentActivityAt: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
						deletedAt: null
					});
					successCount++;
					log.debug({ row: line }, 'Person imported successfully');
				}
			} catch (error) {
				log.error({ error }, 'Database insert error');
				//if it's a postgres unique error, handle that
				failedCount++;
				const isPostgresUniqueError =
					error instanceof Error &&
					'cause' in error &&
					typeof error.cause === 'object' &&
					error.cause !== null &&
					'code' in error.cause &&
					typeof error.cause.code === 'string' &&
					error.cause.code === '23505';
				const errorMessage = isPostgresUniqueError
					? 'A person with this email address or phone number already exists'
					: 'Database insert error: Unknown error';
				failedRows.push({
					row: line,
					error: errorMessage,
					data: csvRow
				});
			}
		} catch (error) {
			failedCount++;
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error importing person';
			failedRows.push({
				row: line,
				error: errorMessage,
				data: csvRow
			});
			log.error({ row: line, error: errorMessage }, 'Failed to import person');
		}
	}

	return {
		totalRows: records.length,
		successCount,
		failedCount,
		failedRows
	};
}
