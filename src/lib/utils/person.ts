// if you update these options, you must also update the genderOptions array in utils/person/gender/render.ts
export const genderOptions = ['male', 'female', 'other', 'not-specified'] as const;
export type GenderOption = (typeof genderOptions)[number];

/**
 * Returns the outer bounds of the dates that a date of birth can be to be in this age group
 * @param {number} lowerEndYearsAgo - The lower end of the age range in years ago
 * @param {number} upperEndYearsAgo - The upper end of the age range in years ago
 * @returns {object} - An object containing the min and max dates
 * @returns {Date} min - The minimum date of birth
 * @returns {Date} max - The maximum date of birth
 * @example
 * const {min, max} = returnAgeRange(18, 24);
 * // min will be the date of birth for a person who is 24 year old
 * // max will be the date of birth for a person who is 18 year old
 **/
function returnAgeRange(lowerEndYearsAgo: number, upperEndYearsAgo: number) {
	// Return the outer bounds of the dates that a date of birth can be to be in this age group
	const now = new Date();
	const lowerEnd = new Date(
		now.getFullYear() - lowerEndYearsAgo,
		now.getMonth(),
		now.getDate(),
		0,
		0,
		0,
		0
	); // We can use 0,0,0,0 because we are only interested in the date
	const upperEnd = new Date(
		now.getFullYear() - upperEndYearsAgo,
		now.getMonth(),
		now.getDate(),
		0,
		0,
		0,
		0
	); // We can use 0,0,0,0 because we are only interested in the date
	return {
		min: upperEnd,
		max: lowerEnd
	};
}

export const ageGroups = {
	'18-24': () => returnAgeRange(18, 24),
	'25-34': () => returnAgeRange(25, 34),
	'35-44': () => returnAgeRange(35, 44),
	'45-54': () => returnAgeRange(45, 54),
	'55-64': () => returnAgeRange(55, 64),
	'65+': () => returnAgeRange(65, 400),
	'under-40': () => returnAgeRange(0, 40)
} as const;
export type AgeGroupKey = keyof typeof ageGroups;
export const ageGroupList: AgeGroupKey[] = [
	'18-24',
	'25-34',
	'35-44',
	'45-54',
	'55-64',
	'65+',
	'under-40'
] as const;
