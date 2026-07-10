import { parseImportCsv } from '$lib/server/utils/person/import';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function apiBulkUpsert({
	organizationId,
	csvUrl
}: {
	organizationId: string;
	csvUrl: string;
}) {
	const csvResult = await fetch(csvUrl);
	if (!csvResult.ok) {
		throw new Error(`Failed to fetch CSV: ${csvUrl}`);
	}
	const csvText = await csvResult.text();
	if (!csvText) {
		throw new Error(`Failed to fetch CSV text: ${csvUrl}`);
	}
	const parseResult = await parseImportCsv({
		csvString: csvText,
		organizationId,
		addedFrom: { type: 'rest_api' },
		upsert: true
	});

	log.info(
		{
			organizationId,
			totalRows: parseResult.totalRows,
			successCount: parseResult.successCount,
			failedCount: parseResult.failedCount
		},
		'CSV parsing completed'
	);
}
