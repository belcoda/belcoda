export function getAvatarFallback(
	name1: string | null | undefined,
	name2?: string | null
): string | null {
	const clean = (s: string) =>
		s
			.normalize('NFKC')
			.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Symbol}]/gu, '')
			.trim();

	const isValid = (s: any): s is string => typeof s === 'string' && clean(s).length > 0;

	if (isValid(name1) && isValid(name2)) {
		const first = clean(name1)[0];
		const second = clean(name2)[0];
		return (first + second).toUpperCase();
	}

	const valid = isValid(name1) ? clean(name1) : isValid(name2) ? clean(name2) : null;
	if (valid && valid.length >= 1) {
		return valid.slice(0, 2); // no uppercase
	}

	return null;
}
