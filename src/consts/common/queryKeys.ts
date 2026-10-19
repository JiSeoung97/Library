/**
 * TanStack Query 키 접두어 — 서비스끼리 서로의 캐시를 무효화하므로(대출 처리 → 도서 재고·회원 연체) 한 곳에서 관리한다.
 * 실제 키는 [접두어, ...조회 조건] 형태이고, 접두어만으로 무효화하면 조건과 무관하게 전부 다시 조회된다.
 */
export const QUERY_KEYS = {
	BOOK_LIST: 'book-list',
	BOOK_COPIES: 'book-copies',
	MEMBER_LIST: 'member-list',
	MEMBER: 'member',
	MEMBER_LOAN_HISTORY: 'member-loan-history',
	LOAN_LIST: 'loan-list',
	LOAN_SUMMARY: 'loan-summary',
} as const;

export type TQueryKey = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS];
