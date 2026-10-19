import HttpMockClient from '@/mocks/networks/httpMockClient';
import type { IFiltering, IRequestBody, ISortings } from '@/types/common/repository';

export default abstract class BaseMockRepository<T> {
	protected readonly httpMockClient = new HttpMockClient();

	protected items: T[] = [];

	protected abstract getId(item: T): number;

	protected abstract createItem(overrides?: Partial<T>): T;

	public getHandlers = () => this.httpMockClient.getHandlers();

	protected seed(count: number, factory: (index: number) => T): void {
		this.items = Array.from({ length: count }, (_, index) => factory(index));
	}

	public getAll(): T[] {
		return [...this.items];
	}

	protected matchesFilter(row: T, key: string, value: unknown): boolean {
		if (value === undefined || value === null || value === '') return true;
		const target = row[key as keyof T];
		if (typeof target !== 'string') return target === value;
		return target.toLowerCase().includes(String(value).toLowerCase());
	}

	protected matchesFiltering<R = T>(row: R, filter: IFiltering): boolean {
		const target = row[filter.columName as keyof R];
		if (target === undefined || target === null) return false;

		if (filter.typeFilter === 'Equal') return String(target) === filter.valueDefault;
		return String(target).toLowerCase().includes(filter.valueDefault.toLowerCase());
	}

	protected applyFiltering<R = T>(rows: R[], filtering: IFiltering[] = []): R[] {
		if (filtering.length === 0) return rows;
		return rows.filter(row => filtering.every(filter => this.matchesFiltering(row, filter)));
	}

	protected applySortings<R = T>(rows: R[], sortings: ISortings[] = []): R[] {
		if (sortings.length === 0) return rows;
		return [...rows].sort((a, b) => {
			for (const { columName, typeSorting } of sortings) {
				const aValue = a[columName as keyof R];
				const bValue = b[columName as keyof R];
				const compared =
					typeof aValue === 'number' && typeof bValue === 'number'
						? aValue - bValue
						: String(aValue ?? '').localeCompare(String(bValue ?? ''));
				if (compared !== 0) return typeSorting === 'DESC' ? -compared : compared;
			}
			return 0;
		});
	}

	// filtering/sortings/skip/take 적용 — 커스텀 data 필터를 가진 리포는 자체 필터 후 query 로 위임.
	// R: 저장소의 항목(T)과 다른 모양의 행(예: 낱권 + 현재 대출 정보)도 같은 규칙으로 정렬 · 페이징할 수 있게 열어 둔다
	protected query<R = T>(rows: R[], body: IRequestBody<unknown>): { items: R[]; total: number } {
		const filtered = this.applyFiltering(rows, body.filtering);
		const sorted = this.applySortings(filtered, body.sortings);
		const skip = body.skip ?? 0;
		const take = body.take ?? 0;
		return {
			items: take > 0 ? sorted.slice(skip, skip + take) : sorted.slice(skip),
			total: sorted.length,
		};
	}

	protected getList(body: IRequestBody<unknown>): {
		items: T[];
		total: number;
	} {
		const data = (body.data ?? {}) as Record<string, unknown>;
		const rows = this.items.filter(row =>
			Object.entries(data).every(([key, value]) => this.matchesFilter(row, key, value)),
		);
		return this.query(rows, body);
	}

	protected create(data: Partial<T>): T {
		const item = this.createItem(data);
		this.items.unshift(item);
		return item;
	}

	protected update(id: number, data: Partial<T>): T {
		const index = this.items.findIndex(item => this.getId(item) === id);
		if (index === -1) throw new Error(`Item not found: ${id}`);
		this.items[index] = { ...this.items[index], ...data };
		return this.items[index];
	}

	protected delete(id: number): void {
		const index = this.items.findIndex(item => this.getId(item) === id);
		if (index !== -1) this.items.splice(index, 1);
	}

	protected findById(id: number): T | undefined {
		return this.items.find(item => this.getId(item) === id);
	}
}
