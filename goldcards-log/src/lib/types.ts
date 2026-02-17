export interface GoldCard {
	id: string;
	date: string; // ISO datetime string (e.g., "2024-01-15T14:30:00.000Z")
	comment: string;
}

export interface BudgetAdjustment {
	id: string;
	adjustment: number;
	comment: string;
	date: string; // ISO datetime string
}
