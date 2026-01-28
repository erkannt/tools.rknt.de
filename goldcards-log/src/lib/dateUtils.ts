export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	// `undefined` lets Intl pick up the browser's locale automatically
	return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}
