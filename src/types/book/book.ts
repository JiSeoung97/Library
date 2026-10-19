export type TBookStatus = 'ACTIVE' | 'DELETED';

export interface IBook {
	bookId: number;
	isbn: string;
	title: string;
	author: string;
	publisher: string;
	category: string;
	publishedAt: string;
	totalQty: number;
	availableQty: number;
	status: TBookStatus;
	createdAt: string;
	updatedAt: string;
}

/** 도서 목록 조회 조건 — 항목별로 모두 AND 로 걸리고, 빈 값은 조건에서 빠진다 */
export interface IBookSearch {
	title?: string;
	author?: string;
	category?: string;
	publisher?: string;
	availability?: TBookAvailability | '';
}

/** 대출 가능 여부 — 필드가 아니라 재고(availableQty)로부터 파생된다 */
export type TBookAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export type TBookCopyStatus = 'AVAILABLE' | 'ON_LOAN' | 'LOST';

export interface IBookCopy {
	copyId: number;
	bookId: number;
	lotNo: string;
	status: TBookCopyStatus;
	createdAt: string;
}

export interface IBookCopyWithLoan extends IBookCopy {
	/** 이 낱권의 현재 대출(대출중 · 연체) — 낱권이 ON_LOAN 일 때만 있다 */
	activeLoan: {
		loanId: number;
		memberName: string;
		loanedAt: string;
		dueAt: string;
		isOverdue: boolean;
		overdueDays: number;
	} | null;
}
