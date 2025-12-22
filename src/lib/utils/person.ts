export const genderOptions = ['male', 'female', 'other', 'not-specified'] as const;
export type GenderOption = (typeof genderOptions)[number];
export const genderSelectOptions: { value: GenderOption; label: string }[] = [
	{
		value: 'female',
		label: 'Female'
	},
	{
		value: 'male',
		label: 'Male'
	},
	{
		value: 'other',
		label: 'Other'
	},
	{
		value: 'not-specified',
		label: 'Not Specified'
	}
] as const;

export const renderGender = (gender: string) => {
	// get the label from genderSelectOptions
	const option = genderSelectOptions.find((option) => option.value === gender)?.label;
	return option ? option : 'Not Specified';
};
