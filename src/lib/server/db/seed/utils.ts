export function generateRandomDatePairs(count = 50): [Date[], Date[]] {
	const startDates: Date[] = [];
	const endDates: Date[] = [];

	const now = new Date();
	const twoMonthsLater = new Date();
	twoMonthsLater.setMonth(now.getMonth() + 2);

	for (let i = 0; i < count; i++) {
		// Random date within 2 months
		const randomTime = now.getTime() + Math.random() * (twoMonthsLater.getTime() - now.getTime());
		const day = new Date(randomTime);
		day.setHours(0, 0, 0, 0); // Start of day

		// Random 15-min interval start time between 10:00 and 18:45
		const startHour = 10 + Math.floor(Math.random() * 9); // 10–18
		const startQuarter = Math.floor(Math.random() * 4); // 0,1,2,3
		const startMinutes = startQuarter * 15;

		const start = new Date(day);
		start.setHours(startHour, startMinutes, 0, 0);

		// Max duration so end stays on same day: until 19:00
		const maxEndMinutes = 19 * 60 - (startHour * 60 + startMinutes); // in minutes
		const maxQuarters = Math.floor(maxEndMinutes / 15);
		const minQuarters = 2; // 30 min

		const durationQuarters =
			minQuarters + Math.floor(Math.random() * (maxQuarters - minQuarters + 1));
		const durationMinutes = durationQuarters * 15;

		const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

		startDates.push(start);
		endDates.push(end);
	}
	return [startDates, endDates];
}

export function selectOneOfArray<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

export function randomOrNull<T>(chance: number, value: T): T | null {
	return Math.random() < chance ? value : null;
}
