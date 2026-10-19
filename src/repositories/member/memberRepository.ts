import type HttpClient from '@/networks/httpClient';
import BaseRepository from '@/repositories/common/baseRepository';
import type { IRequestBody, IResponseBody } from '@/types/common/repository';
import type { ILoan } from '@/types/loan/loan';
import type { IMember, IMemberSearch, IMemberUpsertBody } from '@/types/member/member';

/**
 * 회원 API — URL 과 요청 · 응답 타입만 정한다 (캐시 · 화면 갱신은 MemberService 가 맡는다).
 *
 * 작성 규칙 (mes_FE repository-service.md):
 * - 모든 메서드는 `body: IRequestBody<T>` 하나만 받는다. 식별자(memberId)와 저장할 값은 모두 `body.data` 에 넣는다.
 * - httpClient 제네릭은 `<typeof body, IResponseBody<응답 내용>>`.
 * - 전송은 전부 POST 라서 동작을 URL 끝(/list · /detail · /create · /update · /delete)으로 구분한다.
 */
export default class MemberRepository extends BaseRepository {
	constructor(private readonly httpClient: HttpClient) {
		super('/api/members');
	}

	/** 회원 목록 — body 에 페이징 · 정렬 · 컬럼 필터 · 검색 조건(이름 · 상태)이 들어 있다 */
	public getMemberList = (body: IRequestBody<IMemberSearch>) =>
		this.httpClient.get<typeof body, IResponseBody<IMember[]>>(`${this.path}/list`, body);

	/** 회원 한 명 (내 정보 화면) */
	public getMember = (body: IRequestBody<{ memberId?: number }>) =>
		this.httpClient.get<typeof body, IResponseBody<IMember>>(
			`${this.path}/${body.data?.memberId}/detail`,
			body,
		);

	/** 아이디 중복 확인 — 아이디를 URL 에 넣지 않고 data 로 보내 특수문자 인코딩을 신경 쓰지 않는다 */
	public getLoginIdAvailability = (body: IRequestBody<{ loginId: string }>) =>
		this.httpClient.get<typeof body, IResponseBody<{ available: boolean }>>(
			`${this.path}/login-id/availability`,
			body,
		);

	/** 회원 등록 */
	public postMember = (body: IRequestBody<IMemberUpsertBody>) =>
		this.httpClient.post<typeof body, IResponseBody<IMember>>(`${this.path}/create`, body);

	/** 회원 수정 — data 에 memberId 와 바꿀 값이 함께 들어 있다 (비밀번호는 입력했을 때만 바뀐다) */
	public putMember = (body: IRequestBody<IMemberUpsertBody>) =>
		this.httpClient.put<typeof body, IResponseBody<IMember>>(
			`${this.path}/${body.data?.memberId}/update`,
			body,
		);

	/** 회원 탈퇴 — 진행 중인 대출이 있으면 서버가 거절한다 */
	public deleteMember = (body: IRequestBody<{ memberId: number }>) =>
		this.httpClient.delete<typeof body, IResponseBody<null>>(
			`${this.path}/${body.data?.memberId}/delete`,
			body,
		);

	/** 한 회원의 대출 이력 (내 대출 현황 · 내 정보 · 회원 대출 이력 모달) */
	public getMemberLoanHistory = (body: IRequestBody<{ memberId?: number }>) =>
		this.httpClient.get<typeof body, IResponseBody<ILoan[]>>(
			`${this.path}/${body.data?.memberId}/loans`,
			body,
		);
}
