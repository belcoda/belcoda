// place files you want to import through the `$lib` alias in this folder.
export function t(strings: TemplateStringsArray, ...values: string[]): string {
	return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}
