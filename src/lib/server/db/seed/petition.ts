import { faker } from '@faker-js/faker';
import { slugify } from '$lib/utils/slug';
import { selectOneOfArray } from '$lib/server/db/seed/utils';
import { petition as petitionTable, actionCode as actionCodeTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';
import { nanoid } from '$lib/schema/helpers';

export function generatePetitions(
	count: number = 30,
	options: { organizationId: string; teamId?: string; pointPersonId?: string }
): {
	petitions: (typeof petitionTable.$inferInsert)[];
	actionCodes: (typeof actionCodeTable.$inferInsert)[];
} {
	const ids = new Array(count).fill(0).map(() => uuidv7());
	const petitions: (typeof petitionTable.$inferInsert)[] = [];

	for (let i = 0; i < count; i++) {
		const petitionTitle = generatePetitionTitle();
		const slug = ids[i];

		// Random petition target
		const target = selectOneOfArray(petitionTargets);

		const petition: typeof petitionTable.$inferInsert = {
			id: ids[i],
			title: petitionTitle,
			slug: slug,
			description: null,
			shortDescription: faker.lorem.paragraph(),
			petitionTarget: target,
			petitionText: faker.lorem.paragraphs(3),
			published: faker.datatype.boolean(0.7), // 70% published
			settings: {
				survey: {
					schemaVersion: '1.0.0',
					collections: [
						{
							id: faker.string.uuid(),
							title: 'Petition information',
							description: null,
							questions: [],
							nextCollectionId: null,
							previousCollectionId: null
						}
					]
				},
				tags: [],
				whatsappFlowId: null,
				whatsappFlowYCloudId: null,
				whatsappFlowCreatedAt: null
			},
			featureImage: faker.image.urlPicsumPhotos({
				width: 900,
				height: 600
			}),
			organizationId: options.organizationId,
			teamId: Math.random() > 0.5 ? options.teamId : undefined,
			pointPersonId: options.pointPersonId,
			createdAt: faker.date.recent({ days: 60 }),
			updatedAt: faker.date.recent({ days: 30 }),
			archivedAt: Math.random() > 0.9 ? faker.date.recent({ days: 10 }) : undefined
		};
		petitions.push(petition);
	}

	const actionCodes: (typeof actionCodeTable.$inferInsert)[] = [];
	for (let i = 0; i < petitions.length; i++) {
		const petition = petitions[i];
		actionCodes.push({
			id: nanoid(),
			organizationId: options.organizationId,
			referenceId: petition.id,
			type: 'petition_signed',
			createdAt: petition.createdAt
		});
	}

	return { petitions, actionCodes };
}

const petitionVerbs = [
	'Save',
	'Protect',
	'Defend',
	'Fund',
	'Support',
	'Expand',
	'Restore',
	'Strengthen'
];
const petitionStopVerbs = ['Stop', 'End', 'Ban', 'Halt', 'Cancel', 'Reject', 'Defund', 'Abolish'];
const petitionSubjects = [
	'Our Community Parks',
	'Public Education',
	'Clean Water',
	'Affordable Housing',
	'Workers Rights',
	'Voting Rights',
	'Indigenous Land Rights',
	'LGBTQ+ Rights',
	'Reproductive Rights',
	'Disability Rights',
	'Immigrant Rights',
	'Refugee Rights',
	'Press Freedom',
	'Net Neutrality',
	'Public Transit',
	'Community Health Centers',
	'Public Libraries',
	'Renewable Energy',
	'Green Jobs',
	'Old Growth Forests',
	'Ocean Life',
	'Endangered Species',
	'Pollinators',
	'Wetlands',
	'Coral Reefs',
	'River Systems',
	'Clean Air',
	'Soil Health',
	'Wildlife Habitats',
	'Biodiversity'
];
const petitionStopSubjects = [
	'the Pipeline Project',
	'Police Brutality',
	'Corporate Tax Evasion',
	'Corporate Pollution',
	'Gentrification',
	'Predatory Lending',
	'Deforestation',
	'Factory Farming',
	'Voter Suppression',
	'Toxic Dumping',
	'Corporate Monopolies',
	'Urban Sprawl',
	'Wage Discrimination',
	'Workplace Harassment',
	'Surveillance Capitalism',
	'the Digital Divide',
	'Evictions',
	'Mass Incarceration',
	'Cash Bail',
	'Fracking',
	'Oil Drilling',
	'Child Poverty',
	'Medical Debt',
	'Lead Contamination',
	'Redlining',
	'Food Deserts',
	'Wage Theft',
	'Prison Privatization',
	'Solitary Confinement'
];

export function generatePetitionTitle(): string {
	const isStop = faker.datatype.boolean();
	if (isStop) {
		return `${faker.helpers.arrayElement(petitionStopVerbs)} ${faker.helpers.arrayElement(petitionStopSubjects)}`;
	}
	return `${faker.helpers.arrayElement(petitionVerbs)} ${faker.helpers.arrayElement(petitionSubjects)}`;
}

export const petitionTargets = [
	'City Council',
	'State Legislature',
	'Governor',
	'U.S. Congress',
	'Mayor',
	'County Board',
	'School Board',
	'State Attorney General',
	'Department of Education',
	'Environmental Protection Agency',
	'Department of Justice',
	'Public Health Department',
	'Housing Authority',
	'Transit Authority',
	'Police Commissioner',
	'Corporate Board of Directors',
	'University President',
	'Hospital Administrator',
	'Department of Transportation',
	'State Supreme Court'
];
