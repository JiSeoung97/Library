import { OVERDUE_FEE_PER_DAY } from '@/consts/loan/loan';
import type { ILoan } from '@/types/loan/loan';

/** 연체료 — 연체 중인 건만 연체일수 × 1일 연체료. 결제 연동은 과제 범위 밖이라 표시만 한다 */
export const toOverdueFee = (loan: Pick<ILoan, 'status' | 'overdueDays'>) =>
	loan.status === 'OVERDUE' ? loan.overdueDays * OVERDUE_FEE_PER_DAY : 0;
