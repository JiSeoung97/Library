import { QUERY_KEYS } from '@/consts/common/queryKeys';
import type LoanRepository from '@/repositories/loan/loanRepository';
import BaseService from '@/services/common/baseService';
import type { IRequestBody } from '@/types/common/repository';
import type { ILoanCreateBody, ILoanSearch } from '@/types/loan/loan';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

/** 대출 한 건만 가리키면 되는 쓰기 훅(연장 승인 · 거절 · 반납)의 공통 인자 — 호출: `mutate({ data: { loanId } })` */
type TLoanIdData = Pick<IRequestBody<{ loanId: number }>, 'data'>;

/**
 * 대출의 서버 상태 — Repository 요청을 TanStack Query 훅으로 감싼다.
 *
 * 작성 규칙 (mes_FE repository-service.md):
 * - 훅 이름 = `use` + Repository 메서드 이름 (1:1).
 * - 조회 훅은 `body: IRequestBody` 하나만 받는다 (조건이 없는 조회도 body 를 받고 호출부가 `{}` 를 넘긴다).
 * - 쓰기 훅은 `{ data }` 를 받는다 → 화면은 항상 `mutate({ data: 보낼 값 })` 한 가지 모양으로 부른다.
 */
export default class LoanService extends BaseService {
	constructor(private readonly loanRepository: LoanRepository) {
		super();
	}

	/** 대출 목록 — 조건(body)이 queryKey 에 들어 있어 페이지 · 검색 · 상태 탭이 바뀌면 자동으로 다시 조회된다 */
	public useGetLoanList = (body: IRequestBody<ILoanSearch>) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.LOAN_LIST, body),
			queryFn: () => this.loanRepository.getLoanList(body),
			placeholderData: keepPreviousData,
		});

	/** 대시보드 카드 숫자 — 조건이 없어 호출부는 `useGetLoanSummary({})` 로 부른다 */
	public useGetLoanSummary = (body: IRequestBody) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.LOAN_SUMMARY, body),
			queryFn: () => this.loanRepository.getLoanSummary(body),
		});

	/**
	 * 대출 상태가 바뀌면 함께 달라지는 캐시를 한 번에 무효화한다.
	 * 대출 한 건이 바뀌면 → 대출 목록 · 대시보드 숫자 · 도서 재고(목록 · 낱권) · 회원 연체 수(목록 · 단건) · 회원 대출 이력이 모두 달라진다.
	 * 화면이 하나씩 다시 부르지 않아도, 이 키를 보고 있던 모든 화면이 자동으로 최신 상태가 된다.
	 */
	private invalidateLoanQueries = () =>
		this.invalidate(
			QUERY_KEYS.LOAN_LIST,
			QUERY_KEYS.LOAN_SUMMARY,
			QUERY_KEYS.BOOK_LIST,
			QUERY_KEYS.BOOK_COPIES,
			QUERY_KEYS.MEMBER_LIST,
			QUERY_KEYS.MEMBER,
			QUERY_KEYS.MEMBER_LOAN_HISTORY,
		);

	/** 대출 처리 (관리자) — 호출: `mutate({ data: { memberId, bookId } })` */
	public usePostLoan = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<ILoanCreateBody>, 'data'>) =>
				this.loanRepository.postLoan({ data }),
			onSuccess: this.invalidateLoanQueries,
		});

	/** 반납기한 연장 신청 (회원) — 호출: `mutate({ data: { loanId, reason } })` */
	public usePostExtensionRequest = () =>
		useMutation({
			mutationFn: ({
				data,
			}: Pick<IRequestBody<{ loanId: number; reason: string }>, 'data'>) =>
				this.loanRepository.postExtensionRequest({ data }),
			onSuccess: this.invalidateLoanQueries,
		});

	/** 연장 신청 승인 (관리자) */
	public usePatchExtensionApprove = () =>
		useMutation({
			mutationFn: ({ data }: TLoanIdData) =>
				this.loanRepository.patchExtensionApprove({ data }),
			onSuccess: this.invalidateLoanQueries,
		});

	/** 연장 신청 거절 (관리자) */
	public usePatchExtensionReject = () =>
		useMutation({
			mutationFn: ({ data }: TLoanIdData) =>
				this.loanRepository.patchExtensionReject({ data }),
			onSuccess: this.invalidateLoanQueries,
		});

	/** 반납 처리 (관리자) */
	public usePatchLoanReturn = () =>
		useMutation({
			mutationFn: ({ data }: TLoanIdData) => this.loanRepository.patchLoanReturn({ data }),
			onSuccess: this.invalidateLoanQueries,
		});
}
