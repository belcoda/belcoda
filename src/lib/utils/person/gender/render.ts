import { t } from '$lib/index.svelte';

// if you update these options, you must also update the genderOptions array in utils/person.ts
export const renderGender = (gender: string) => {
	switch (gender) {
		case 'male':
			return t`Male`;
		case 'female':
			return t`Female`;
		case 'other':
			return t`Other`;
		default:
			return t`Not Specified`;
	}
};
