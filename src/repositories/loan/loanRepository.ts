import type HttpClient from '@/networks/httpClient';
import BaseRepository from '@/repositories/common/baseRepository';
import type { IRequestBody, IResponseBody } from '@/types/common/repository';
import type { ILoan, ILoanCreateBody, ILoanSearch, ILoanSummary } from '@/types/loan/loan';

/** 대출 한 건을 가리키기만 하면 되는 요청(연장 승인 · 거절 · 반납)의 공통 body */
type TLoanIdBody = IRequestBody<{ loanId: number }>;

/**
 * 대출 API — URL 과 요청 · 응답 타입만 정한다 (캐시 · 화면 갱신은 LoanService 가 맡는다).
 *
 * 작성 규칙 (mes_FE repository-service.md):
 * - 모든 메서드는 `body: IRequestBody<T>` 하나만 받는다. 식별자(loanId)와 보낼 값은 모두 `body.data` 에 넣는다.
 * - httpClient 제네릭은 `<typeof body, IResponseBody<응답 내용>>`.
 * - 전송은 전부 POST — 메서드 이름(get · post · patch)은 의도이고, 동작은 URL 끝(/approve · /return …)으로 구분한다.
 *
 * 대출 한 건의 흐름: 관리자 대출 처리(create) → [회원 연장 신청(extension-request) → 관리자 연장 승인 · 거절]
 *                  → 관리자 반납 처리(return)
 */
export default class LoanRepository extends BaseRepository {
	constructor(private readonly httpClient: HttpClient) {
		super('/api/loans');
	}

	/** 대출 목록 — body 에 페이징 · 정렬 · 컬럼 필터 · 검색 조건(회원명 · 도서명 · 상태 · 기간)이 들어 있다 */
	public getLoanList = (body: IRequestBody<ILoanSearch>) =>
		this.httpClient.get<typeof body, IResponseBody<ILoan[]>>(`${this.path}/list`, body);

	/** 대시보드 카드 숫자 (전체 도서 · 대출중 · 연체 · 연장 승인대기) — 조건이 없어도 규칙대로 body 를 받는다 */
	public getLoanSummary = (body: IRequestBody) =>
		this.httpClient.get<typeof body, IResponseBody<ILoanSummary>>(`${this.path}/summary`, body);

	/** 대출 처리 (관리자) — 고른 회원에게 고른 도서를 바로 대출한다. 대출일 · 반납 예정일은 서버가 정한다 */
	public postLoan = (body: IRequestBody<ILoanCreateBody>) =>
		this.httpClient.post<typeof body, IResponseBody<ILoan>>(`${this.path}/create`, body);

	/** 반납기한 연장 신청 (회원) — 사유와 함께 접수하고 관리자 승인을 기다린다 */
	public postExtensionRequest = (body: IRequestBody<{ loanId: number; reason: string }>) =>
		this.httpClient.post<typeof body, IResponseBody<ILoan>>(
			`${this.path}/${body.data?.loanId}/extension-request`,
			body,
		);

	/** 연장 신청 승인 (관리자) — 반납기한이 늘어나고 연장 횟수가 1 오른다 */
	public patchExtensionApprove = (body: TLoanIdBody) =>
		this.httpClient.patch<typeof body, IResponseBody<ILoan>>(
			`${this.path}/${body.data?.loanId}/extension-approve`,
			body,
		);

	/** 연장 신청 거절 (관리자) */
	public patchExtensionReject = (body: TLoanIdBody) =>
		this.httpClient.patch<typeof body, IResponseBody<ILoan>>(
			`${this.path}/${body.data?.loanId}/extension-reject`,
			body,
		);

	/** 반납 처리 (관리자) — 낱권이 다시 대출 가능해진다 */
	public patchLoanReturn = (body: TLoanIdBody) =>
		this.httpClient.patch<typeof body, IResponseBody<ILoan>>(
			`${this.path}/${body.data?.loanId}/return`,
			body,
		);
}
