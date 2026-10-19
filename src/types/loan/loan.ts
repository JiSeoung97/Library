/**
 * 대출 상태 — 관리자가 창구에서 바로 대출하므로(과제 3-3 "회원 선택 → 도서 선택 → 대출 처리") 신청 · 승인 단계가 없다.
 * BORROWED(대출중) → 반납하면 RETURNED, 반납 기한이 지나면 OVERDUE(연체).
 */
export type TLoanStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE';

export interface ILoan {
	loanId: number;
	memberId: number;
	memberName: string;
	copyId: number;
	lotNo: string;
	bookId: number;
	bookTitle: string;
	/** 도서 저자 — 대출 목록에서 어떤 책인지 알아보기 쉽게 도서 정보를 함께 내려준다 */
	bookAuthor: string;
	/** 도서 출판사 */
	bookPublisher: string;
	/** 대출일 — 관리자가 대출 처리한 시각 */
	loanedAt: string;
	/** 반납 예정일 — 대출일 + 대출 기간. 연장이 승인되면 늘어난다 */
	dueAt: string;
	returnedAt?: string | null;
	status: TLoanStatus;
	overdueDays: number;
	/** 반납기한 연장 횟수 (최대 2회) */
	extensionCount: number;
	/** 연장 신청이 승인 대기 중이면 신청 사유, 아니면 null */
	pendingExtensionReason?: string | null;
	createdAt: string;
}

/** 대출 목록 조회 조건 — 모두 AND 로 걸린다 */
export interface ILoanSearch {
	/** 회원명 부분 일치 (대소문자 무시) */
	memberName?: string;
	/** 도서명 부분 일치 (대소문자 무시) */
	bookTitle?: string;
	/** 대출일 기간의 시작 'YYYY-MM-DD' — 이 날짜 이후(당일 포함)에 대출된 건만. 빈 값이면 조건 없음 */
	loanedFrom?: string;
	/** 대출일 기간의 끝 'YYYY-MM-DD' — 이 날짜 이전(당일 포함)에 대출된 건만. 빈 값이면 조건 없음 */
	loanedTo?: string;
	/** 반납예정일 기간의 시작 'YYYY-MM-DD' (당일 포함). 빈 값이면 조건 없음 */
	dueFrom?: string;
	/** 반납예정일 기간의 끝 'YYYY-MM-DD' (당일 포함). 빈 값이면 조건 없음 */
	dueTo?: string;
	status?: TLoanStatus;
	/** true 면 연장 신청이 승인 대기 중인 건만 (연장 승인 화면) */
	hasPendingExtension?: boolean;
}

/** 관리자 대출 처리 요청 본문 — 어떤 회원에게 어떤 도서를 빌려주는지 */
export interface ILoanCreateBody {
	memberId: number;
	bookId: number;
}

export interface ILoanSummary {
	totalBookCount: number;
	borrowedCount: number;
	overdueCount: number;
	pendingExtensionCount: number;
}
