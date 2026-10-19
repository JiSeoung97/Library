import type { IMockContext } from '@/mocks/networks/httpMockClient';
import { faker } from '@faker-js/faker';

import { CATEGORIES } from '@/consts/book/book';
import BaseMockRepository from '@/mocks/repositories/common/baseMockRepository';
import type {
	IBook,
	IBookCopy,
	IBookSearch,
	TBookAvailability,
	TBookCopyStatus,
} from '@/types/book/book';
import type { IResponseBody } from '@/types/common/repository';

const BOOK_SEARCH_FIELDS = ['title', 'author', 'category', 'publisher'] as const;

const toAvailability = (book: IBook): TBookAvailability =>
	book.availableQty > 0 ? 'AVAILABLE' : 'UNAVAILABLE';

// 화면의 파생 컬럼(재고 · 대출 가능 여부)은 실제 필드가 없어 "가능 권수 / 전체 권수" 두 값으로 정렬한다.
// 1차: 대출 가능 권수(칩의 앞 숫자) → 같으면 2차: 전체 권수(뒤 숫자). 방향은 사용자가 고른 방향을 둘 다 따른다
// 예) 오름차순: 0/1 → 0/2 → 3/4 → 3/5 → 4/4
const DERIVED_SORT_FIELDS: Record<string, (keyof IBook)[]> = {
	qty: ['availableQty', 'totalQty'],
	availability: ['availableQty', 'totalQty'],
};

export default class BookMockRepository extends BaseMockRepository<IBook> {
	private sequence = 0;
	private copySequence = 0;
	private copies: IBookCopy[] = [];

	constructor() {
		super();
		this.seed(40, () => this.createItem());
	}

	protected getId = (item: IBook): number => item.bookId;

	// copyId 와 lotNo 는 같은 시퀀스 값을 공유한다 (copyId 1 ↔ LOT-000001)
	private createCopy(bookId: number, status: TBookCopyStatus = 'AVAILABLE'): IBookCopy {
		this.copySequence += 1;
		return {
			copyId: this.copySequence,
			bookId,
			lotNo: `LOT-${String(this.copySequence).padStart(6, '0')}`,
			status,
			createdAt: new Date().toISOString(),
		};
	}

	protected createItem(overrides: Partial<IBook> = {}): IBook {
		this.sequence += 1;
		const bookId = this.sequence;
		const totalQty = overrides.totalQty ?? faker.number.int({ min: 1, max: 5 });
		const now = new Date().toISOString();

		this.copies.push(...Array.from({ length: totalQty }, () => this.createCopy(bookId)));

		return {
			bookId,
			isbn: faker.commerce.isbn({ separator: '-' }),
			title: faker.commerce.productName(),
			author: faker.person.fullName(),
			publisher: faker.company.name(),
			category: faker.helpers.arrayElement(CATEGORIES),
			publishedAt: faker.date.past({ years: 10 }).toISOString(),
			totalQty,
			availableQty: totalQty,
			status: 'ACTIVE',
			createdAt: now,
			updatedAt: now,
			...overrides,
		};
	}

	private getCopiesByBookId(bookId: number): IBookCopy[] {
		return this.copies.filter(copy => copy.bookId === bookId);
	}

	private toBookWithQty(book: IBook): IBook {
		const copies = this.getCopiesByBookId(book.bookId);
		return {
			...book,
			totalQty: copies.length,
			availableQty: copies.filter(copy => copy.status === 'AVAILABLE').length,
		};
	}

	// 대출 처리 — AVAILABLE 낱권 하나를 배정하고 ON_LOAN 으로 전환 (loanMockRepository 에서 호출)
	public allocateCopy(bookId: number): IBookCopy | undefined {
		const copy = this.copies.find(
			item => item.bookId === bookId && item.status === 'AVAILABLE',
		);
		if (!copy) return undefined;
		copy.status = 'ON_LOAN';
		return copy;
	}

	// 반납 처리 — 낱권을 다시 AVAILABLE 로 전환 (loanMockRepository 에서 호출)
	public releaseCopy(copyId: number): void {
		const copy = this.copies.find(item => item.copyId === copyId);
		if (copy) copy.status = 'AVAILABLE';
	}

	public getAvailableQty(bookId: number): number {
		return this.getCopiesByBookId(bookId).filter(copy => copy.status === 'AVAILABLE').length;
	}

	public getBookCopies(bookId: number): IBookCopy[] {
		return this.getCopiesByBookId(bookId);
	}

	public getBookById(bookId: number): IBook | undefined {
		const book = this.findById(bookId);
		return book && this.toBookWithQty(book);
	}

	public getBookList = this.httpMockClient.get(
		'/api/books/list',
		async ({ body }: IMockContext<IBookSearch>): Promise<IResponseBody<IBook[]>> => {
			const { availability, ...fields } = body.data ?? {};

			// availability 는 실제 필드가 아니라 재고로부터 매번 계산되는 파생값 — 최신 재고 반영을 위해
			// 재고 계산(toBookWithQty) 이후 별도로 필터링하고, 나머지 filtering 만 query() 에 위임한다
			const availabilityFilter = body.filtering?.find(f => f.columName === 'availability');
			const restFiltering = body.filtering?.filter(f => f.columName !== 'availability');

			const filtered = this.items
				.filter(
					book =>
						book.status === 'ACTIVE' &&
						// 항목별 조건(제목·저자·분류·출판사)은 모두 AND — 빈 값은 조건에서 빠진다
						BOOK_SEARCH_FIELDS.every(key => this.matchesFilter(book, key, fields[key])),
				)
				.map(book => this.toBookWithQty(book))
				// 검색창의 대출 가능 여부와 컬럼 헤더 필터는 같은 기준(재고)으로 거른다
				.filter(
					book =>
						(!availability || toAvailability(book) === availability) &&
						(!availabilityFilter ||
							toAvailability(book) === availabilityFilter.valueDefault),
				);

			// 파생 컬럼 정렬 하나를 실제 필드 정렬 여러 개로 펼친다 (앞에 있는 것이 우선)
			const sortings = body.sortings?.flatMap(sort =>
				(DERIVED_SORT_FIELDS[sort.columName] ?? [sort.columName]).map(columName => ({
					...sort,
					columName,
				})),
			);
			const { items, total } = this.query(filtered, {
				...body,
				sortings,
				filtering: restFiltering,
			});

			return { success: true, returnMess: '', data: items, totalRecords: total };
		},
	);

	public postBook = this.httpMockClient.post(
		'/api/books/create',
		async ({ body }: IMockContext<Partial<IBook>>): Promise<IResponseBody<IBook>> => {
			// 요청 본문은 { data: 도서 정보 } 봉투 — 실제 값은 data 안에 있다
			const { data = {} } = body;
			const created = this.create(data);
			return { success: true, returnMess: '', data: this.toBookWithQty(created) };
		},
	);

	public putBook = this.httpMockClient.put(
		'/api/books/:bookId/update',
		async ({
			body,
			params,
		}: IMockContext<Partial<IBook>>): Promise<IResponseBody<IBook | null>> => {
			const { data = {} } = body;
			const bookId = Number(params.bookId);
			const book = this.findById(bookId);
			if (!book || book.status === 'DELETED')
				return { success: false, returnMess: '도서를 찾을 수 없습니다.', data: null };

			const { totalQty: nextTotalQty, ...rest } = data;
			const copies = this.getCopiesByBookId(bookId);
			const diff = typeof nextTotalQty === 'number' ? nextTotalQty - copies.length : 0;

			// 권수를 줄일 때는 AVAILABLE 낱권만 지울 수 있다 — 대출중·분실 낱권 수 밑으로는 줄이지 못한다
			const availableCopies = copies.filter(copy => copy.status === 'AVAILABLE');
			const minTotalQty = copies.length - availableCopies.length;
			if (diff < 0 && -diff > availableCopies.length)
				return {
					success: false,
					returnMess: `대출 중이거나 분실된 낱권이 ${minTotalQty}권 있어 ${minTotalQty}권 미만으로 줄일 수 없습니다.`,
					data: null,
				};

			const updated = this.update(bookId, rest);

			if (diff > 0) {
				this.copies.push(...Array.from({ length: diff }, () => this.createCopy(bookId)));
			} else if (diff < 0) {
				const removeIds = new Set(availableCopies.slice(0, -diff).map(copy => copy.copyId));
				this.copies = this.copies.filter(copy => !removeIds.has(copy.copyId));
			}

			return { success: true, returnMess: '', data: this.toBookWithQty(updated) };
		},
	);

	// 소프트 삭제 — 대출 이력이 도서를 계속 참조하므로 레코드는 남기고 status 만 DELETED 로 바꾼다
	// 대출 중인 낱권이 있으면 삭제를 막는다
	public deleteBook = this.httpMockClient.delete(
		'/api/books/:bookId/delete',
		async ({ params }): Promise<IResponseBody<null>> => {
			const bookId = Number(params.bookId);
			const book = this.findById(bookId);
			if (!book || book.status === 'DELETED')
				return { success: false, returnMess: '도서를 찾을 수 없습니다.', data: null };
			if (this.getCopiesByBookId(bookId).some(copy => copy.status === 'ON_LOAN'))
				return {
					success: false,
					returnMess: '대출 중인 낱권이 있어 삭제할 수 없습니다.',
					data: null,
				};

			this.update(bookId, { status: 'DELETED', updatedAt: new Date().toISOString() });
			return { success: true, returnMess: '', data: null };
		},
	);
}
