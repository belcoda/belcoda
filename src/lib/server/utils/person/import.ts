import { person } from '$lib/schema/drizzle';
import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { v7 as uuidv7 } from 'uuid';
import { createPerson } from '$lib/schema/person';
import { parse as valibotParse, type InferOutput } from 'valibot';
import type { PersonAddedFrom } from '$lib/schema/person/meta';
import { and, eq, or, isNull, type SQL } from 'drizzle-orm';
import Papa from 'papaparse';
import { mapCsvRowToPerson, providedFields, type CsvPersonInput, type CsvRow } from './csv-map';

const log = pino(import.meta.url);

interface ImportResult {
	totalRows: number;
	successCount: number;
	failedCount: number;
	failedRows: { row: number; error: string; data?: CsvRow }[];
}

type ImportRecord = { csvRow: CsvRow; line: number };
type ValidatedPerson = InferOutput<typeof createPerson>;
type RowProcessResult = { success: true } | { success: false; error: string };

function isEmptyCsvRow(row: Record<string, string>): boolean {
	return Object.values(row).every(
		(value) => value === null || value === undefined || String(value).trim() === ''
	);
}

function parseCsvRecords(csvString: string): ImportRecord[] {
	const parsed = Papa.parse(csvString, { header: true });
	log.debug({ numRows: parsed.data.length }, 'Parsed CSV');
	if (parsed.errors.length > 0) {
		log.error({ errors: parsed.errors }, 'CSV parsing errors');
	}

	const records: ImportRecord[] = [];
	for (const [index, row] of parsed.data.entries()) {
		if (!isEmptyCsvRow(row as Record<string, string>)) {
			records.push({ csvRow: row as CsvRow, line: index + 2 });
		}
	}

	log.debug({ rowCount: records.length }, 'CSV parsing completed');
	return records;
}

function validatePersonInput(personInput: CsvPersonInput): ValidatedPerson {
	return valibotParse(createPerson, {
		...personInput,
		preferredLanguage: personInput.preferredLanguage ?? 'en'
	});
}

async function findExistingPerson(
	validated: ValidatedPerson,
	organizationId: string,
	upsert: boolean
): Promise<typeof person.$inferSelect | undefined> {
	if (!upsert || (!validated.emailAddress && !validated.phoneNumber)) {
		return undefined;
	}

	const whereConditions: SQL[] = [];
	if (validated.emailAddress) {
		whereConditions.push(eq(person.emailAddress, validated.emailAddress));
	}
	if (validated.phoneNumber) {
		whereConditions.push(eq(person.phoneNumber, validated.phoneNumber));
	}

	return drizzle.query.person.findFirst({
		where: and(
			or(...whereConditions),
			eq(person.organizationId, organizationId),
			isNull(person.deletedAt)
		)
	});
}

function buildUpdatePatch(
	csvRow: CsvRow,
	personInput: CsvPersonInput,
	validated: ValidatedPerson
): Partial<typeof person.$inferInsert> {
	const patch: Partial<typeof person.$inferInsert> = {};
	for (const field of providedFields(csvRow)) {
		const mappedValue = (personInput as Record<string, unknown>)[field];
		if (mappedValue === null || mappedValue === undefined) {
			continue;
		}
		(patch as Record<string, unknown>)[field] = (validated as Record<string, unknown>)[field];
	}
	return patch;
}

async function updateExistingPerson(
	existingId: string,
	patch: Partial<typeof person.$inferInsert>,
	organizationId: string
): Promise<void> {
	await drizzle
		.update(person)
		.set({ ...patch, updatedAt: new Date() })
		.where(
			and(
				eq(person.id, existingId),
				eq(person.organizationId, organizationId),
				isNull(person.deletedAt)
			)
		);
}

async function insertNewPerson(
	validated: ValidatedPerson,
	organizationId: string,
	addedFrom: PersonAddedFrom
): Promise<void> {
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
}

function isPostgresUniqueError(error: unknown): error is Error & { cause: { code: string } } {
	return (
		error instanceof Error &&
		'cause' in error &&
		typeof error.cause === 'object' &&
		error.cause !== null &&
		'code' in error.cause &&
		typeof error.cause.code === 'string' &&
		error.cause.code === '23505'
	);
}

function getDatabaseErrorMessage(error: unknown): string {
	return isPostgresUniqueError(error)
		? 'A person with this email address or phone number already exists'
		: 'Database insert error: Unknown error';
}

function logDatabaseError(error: unknown, line: number): void {
	log.error(
		{
			row: line,
			code: isPostgresUniqueError(error) ? error.cause.code : undefined
		},
		'Database insert error'
	);
}

async function persistPerson(
	existing: typeof person.$inferSelect | undefined,
	csvRow: CsvRow,
	personInput: CsvPersonInput,
	validated: ValidatedPerson,
	organizationId: string,
	addedFrom: PersonAddedFrom,
	line: number
): Promise<void> {
	if (existing) {
		const patch = buildUpdatePatch(csvRow, personInput, validated);
		await updateExistingPerson(existing.id, patch, organizationId);
		log.debug({ row: line }, 'Person updated successfully');
		return;
	}

	await insertNewPerson(validated, organizationId, addedFrom);
	log.debug({ row: line }, 'Person imported successfully');
}

async function processImportRow(
	{ csvRow, line }: ImportRecord,
	organizationId: string,
	addedFrom: PersonAddedFrom,
	upsert: boolean
): Promise<RowProcessResult> {
	try {
		const personInput = mapCsvRowToPerson(csvRow);
		const validated = validatePersonInput(personInput);
		const existing = await findExistingPerson(validated, organizationId, upsert);

		try {
			await persistPerson(
				existing,
				csvRow,
				personInput,
				validated,
				organizationId,
				addedFrom,
				line
			);
			return { success: true };
		} catch (error) {
			logDatabaseError(error, line);
			return { success: false, error: getDatabaseErrorMessage(error) };
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error importing person';
		log.error({ row: line, error: errorMessage }, 'Failed to import person');
		return { success: false, error: errorMessage };
	}
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
	const records = parseCsvRecords(csvString);
	let successCount = 0;
	let failedCount = 0;
	const failedRows: { row: number; error: string; data?: CsvRow }[] = [];

	for (const record of records) {
		const result = await processImportRow(record, organizationId, addedFrom, upsert);
		if (result.success) {
			successCount++;
			continue;
		}

		failedCount++;
		failedRows.push({
			row: record.line,
			error: result.error,
			data: record.csvRow
		});
	}

	return {
		totalRows: records.length,
		successCount,
		failedCount,
		failedRows
	};
}
