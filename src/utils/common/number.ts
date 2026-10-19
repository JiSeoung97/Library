export const formatNumber = (value: number | string | null | undefined) => {
	if (value === null || value === undefined || value === '') return '-';

	const num = Number(value);
	return Number.isNaN(num) ? String(value) : num.toLocaleString();
};
