export function parseTemplate(template: string) {
	const regex = /{{(\d+)}}/g;
	const tokens = [];

	let last = 0;
	let match;

	while ((match = regex.exec(template))) {
		if (match.index > last) {
			tokens.push({
				type: 'text' as const,
				value: template.slice(last, match.index)
			});
		}

		tokens.push({
			type: 'var' as const,
			id: Number(match[1])
		});

		last = regex.lastIndex;
	}

	if (last < template.length) {
		tokens.push({
			type: 'text' as const,
			value: template.slice(last)
		});
	}

	return tokens;
}
