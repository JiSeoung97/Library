import { QUERY_KEYS } from '@/consts/common/queryKeys';
import type MemberRepository from '@/repositories/member/memberRepository';
import BaseService from '@/services/common/baseService';
import type { IRequestBody } from '@/types/common/repository';
import type { IMemberSearch, IMemberUpsertBody } from '@/types/member/member';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

/**
 * 회원의 서버 상태 — Repository 요청을 TanStack Query 훅으로 감싼다.
 *
 * 작성 규칙 (mes_FE repository-service.md):
 * - 훅 이름 = `use` + Repository 메서드 이름 (1:1).
 * - 조회 훅은 `body: IRequestBody` 하나만 받는다. 식별자는 `body.data` 에 넣고 `enabled: !!body.data?.id` 로 조회 여부를 정한다.
 * - 쓰기 훅은 `{ data }` 를 받는다 → 화면은 항상 `mutate({ data: 보낼 값 })` 한 가지 모양으로 부른다.
 */
export default class MemberService extends BaseService {
	constructor(private readonly memberRepository: MemberRepository) {
		super();
	}

	/** 회원 목록 — 조건(body)이 queryKey 에 들어 있어 페이지 · 검색이 바뀌면 자동으로 다시 조회된다 */
	public useGetMemberList = (body: IRequestBody<IMemberSearch>) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.MEMBER_LIST, body),
			queryFn: () => this.memberRepository.getMemberList(body),
			placeholderData: keepPreviousData,
		});

	/** 회원 한 명 (내 정보 화면) — memberId 가 없으면 요청하지 않는다 */
	public useGetMember = (body: IRequestBody<{ memberId?: number }>) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.MEMBER, body),
			queryFn: () => this.memberRepository.getMember(body),
			enabled: !!body.data?.memberId,
		});

	/** 한 회원의 대출 이력 — 페이징 · 정렬 · 필터와 memberId 가 queryKey 에 들어 있어 바뀌면 다시 조회한다. memberId 가 없으면 요청하지 않는다 */
	public useGetMemberLoanHistory = (body: IRequestBody<{ memberId?: number }>) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.MEMBER_LOAN_HISTORY, body),
			queryFn: () => this.memberRepository.getMemberLoanHistory(body),
			enabled: !!body.data?.memberId,
			placeholderData: keepPreviousData,
		});

	// 목록과 단건을 함께 갱신한다 — 내 정보 화면은 단건(useGetMember)만 보므로 목록만 무효화하면 옛 값이 남는다
	private invalidateMemberQueries = () =>
		this.invalidate(QUERY_KEYS.MEMBER_LIST, QUERY_KEYS.MEMBER);

	/**
	 * 아이디 중복 확인 — 호출: `mutate({ data: { loginId } })`
	 * 조회인데도 useQuery 가 아니라 useMutation 을 쓴다:
	 * useQuery 는 화면에 나타나는 순간 자동 조회하지만, 이건 "중복 확인" 버튼을 눌렀을 때만 한 번 부르고 결과를 캐시에 남길 필요가 없다.
	 */
	public useGetLoginIdAvailability = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<{ loginId: string }>, 'data'>) =>
				this.memberRepository.getLoginIdAvailability({ data }),
		});

	/** 회원 등록 — 호출: `mutate({ data: 폼 값 })` */
	public usePostMember = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<IMemberUpsertBody>, 'data'>) =>
				this.memberRepository.postMember({ data }),
			onSuccess: this.invalidateMemberQueries,
		});

	/** 회원 수정 — 호출: `mutate({ data: { memberId, ...폼 값 } })` */
	public usePutMember = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<IMemberUpsertBody>, 'data'>) =>
				this.memberRepository.putMember({ data }),
			onSuccess: this.invalidateMemberQueries,
		});

	/** 회원 탈퇴 — 호출: `mutate({ data: { memberId } })` */
	public useDeleteMember = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<{ memberId: number }>, 'data'>) =>
				this.memberRepository.deleteMember({ data }),
			onSuccess: this.invalidateMemberQueries,
		});
}
