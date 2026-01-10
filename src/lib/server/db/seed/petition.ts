import { faker } from '@faker-js/faker';
import { generateUniqueNanoids } from '$lib/server/db/seed/utils';
import { slugify } from '$lib/utils/slug';
import { selectOneOfArray } from '$lib/server/db/seed/utils';
import { petition as petitionTable, actionCode as actionCodeTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';

export function generatePetitions(
	count: number = 30,
	options: { organizationId: string; teamId?: string; pointPersonId?: string }
): {
	petitions: (typeof petitionTable.$inferInsert)[];
	actionCodes: (typeof actionCodeTable.$inferInsert)[];
} {
	const ids = new Array(count).fill(0).map(() => uuidv7());
	const petitionSignedActionCodeIds = generateUniqueNanoids(count);
	const petitions: (typeof petitionTable.$inferInsert)[] = [];
	const usedTitles = new Set<string>();
	const usedSlugs = new Set<string>();

	for (let i = 0; i < count; i++) {
		let petitionTitle: string;
		let slug: string;

		// Generate unique title and slug
		let attempts = 0;
		do {
			petitionTitle = selectOneOfArray(petitionTitles);
			slug = slugify(petitionTitle);
			attempts++;

			// If we've tried too many times with the same title, add a suffix
			if (attempts > 5) {
				petitionTitle = `${petitionTitle} ${faker.number.int({ min: 1, max: 999 })}`;
				slug = slugify(petitionTitle);
			}
		} while (usedTitles.has(petitionTitle) || usedSlugs.has(slug));

		// Add to used sets
		usedTitles.add(petitionTitle);
		usedSlugs.add(slug);

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
				tags: []
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
			id: petitionSignedActionCodeIds[i],
			organizationId: options.organizationId,
			referenceId: petition.id,
			type: 'petition_signed',
			createdAt: petition.createdAt
		});
	}

	return { petitions, actionCodes };
}

export const petitionTitles = [
	'Save Our Community Parks',
	'Stop the Pipeline Project',
	'Protect Voting Rights Now',
	'End Homelessness in Our City',
	'Ban Plastic Bags Citywide',
	'Fund Public Education',
	'Close Private Detention Centers',
	'Defend Net Neutrality',
	'Raise the Minimum Wage',
	'Cancel Student Debt',
	'Universal Healthcare Now',
	'Stop Police Brutality',
	'Climate Action Now',
	'Protect Indigenous Land Rights',
	'End Cash Bail',
	'Justice for All Workers',
	'Ban Fracking in Our State',
	'Affordable Housing for Everyone',
	'Protect LGBTQ+ Rights',
	'End Mass Incarceration',
	'Support Renewable Energy',
	'Stop Corporate Tax Evasion',
	'Defend Immigrant Rights',
	'End Food Deserts',
	'Clean Water is a Right',
	'Stop Gentrification',
	'Support Mental Health Services',
	'End the School-to-Prison Pipeline',
	'Protect Reproductive Rights',
	'Ban Single-Use Plastics',
	'Justice for Farmworkers',
	'Stop Police Militarization',
	'Fund Community Mental Health',
	'End Child Poverty',
	'Protect Public Lands',
	'Support Green Jobs',
	'End Housing Discrimination',
	'Defend Press Freedom',
	'Stop Oil Drilling',
	'Support Universal Childcare',
	'End Workplace Discrimination',
	'Protect Wetlands',
	'Stop Corporate Pollution',
	'Support Living Wages',
	'End Food Waste',
	'Protect Community Gardens',
	'Stop Predatory Lending',
	'Support Public Transit',
	'End Environmental Racism',
	'Protect Whistleblowers',
	'Stop Deforestation',
	'Support Disability Rights',
	'End Prison Privatization',
	'Protect Clean Air',
	'Stop Animal Cruelty',
	'Support Refugee Rights',
	'End Wage Theft',
	'Protect Ocean Life',
	'Stop Factory Farming',
	'Support Arts Education',
	'End Voter Suppression',
	'Protect Native Languages',
	'Stop Toxic Dumping',
	'Support Community Health Centers',
	'End Solitary Confinement',
	'Protect Old Growth Forests',
	'Stop Corporate Monopolies',
	'Support Fair Trade',
	'End Redlining',
	'Protect Biodiversity',
	'Stop Evictions',
	'Support Co-operative Businesses',
	'End Factory Pollution',
	'Protect Coral Reefs',
	'Stop Urban Sprawl',
	'Support Community Land Trusts',
	'End Food Insecurity',
	'Protect Wildlife Habitats',
	'Stop Wage Discrimination',
	'Support Public Libraries',
	'End Utility Shutoffs',
	'Protect River Systems',
	'Stop Workplace Harassment',
	'Support Community Ownership',
	'End Medical Debt',
	'Protect Endangered Species',
	'Stop Bank Redlining',
	'Support Worker Cooperatives',
	'End Lead Contamination',
	'Protect Mountain Ecosystems',
	'Stop Pension Theft',
	'Support Community Radio',
	'End Educational Inequality',
	'Protect Pollinators',
	'Stop Surveillance Capitalism',
	'Support Reparations',
	'End Healthcare Discrimination',
	'Protect Soil Health',
	'Stop Digital Divide',
	'Support Community Gardens'
];

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
