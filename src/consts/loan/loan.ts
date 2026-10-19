import type { IStatusOption } from '@/types/common/option';
import type { TLoanStatus } from '@/types/loan/loan';

/** 대출 정책 — 화면 안내와 mock 서버(loanMockRepository)가 같은 값을 쓴다 */
export const LOAN_PERIOD_DAYS = 14;
export const MAX_ACTIVE_LOAN_COUNT = 5;
export const MAX_EXTENSION_COUNT = 2;
export const EXTENSION_PERIOD_DAYS = 7;
export const MAX_EXTENSION_REASON_LENGTH = 100;
/** 연체 1일당 연체료(원) */
export const OVERDUE_FEE_PER_DAY = 100;

/** 아직 반납하지 않은 상태 — 반납 가능 여부 · 대출 중 권수 · 최대 권수 · 탈퇴 가능 여부 판단에 쓴다 */
export const ACTIVE_LOAN_STATUSES: readonly TLoanStatus[] = ['BORROWED', 'OVERDUE'];

export const LOAN_STATUS_OPTIONS: IStatusOption<TLoanStatus>[] = [
	{ value: 'BORROWED', label: '대출중', color: 'primary' },
	{ value: 'OVERDUE', label: '연체', color: 'error' },
	{ value: 'RETURNED', label: '반납완료', color: 'default' },
];

/** 대시보드 "최근 대출"이 보여 주는 기간(일) — 오늘을 포함해 최근 한 달(30일) 동안 대출된 건. 연체(대출 기간 14일 초과) 건까지 보이도록 대출 기간보다 길게 잡는다 */
export const RECENT_LOAN_DAYS = 30;
