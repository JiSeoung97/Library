import type { IAdmin } from '@/types/admin/admin';
import type { IMember } from '@/types/member/member';

/*
 * 로그인한 사용자 — 관리자 테이블 또는 회원 테이블 중 한 곳의 계정이다.
 *
 * ■ 테이블마다 따로 고르고(Pick) role 로 묶는 이유
 *   관리자와 회원은 테이블이 달라 식별자도 다르다(adminId / memberId).
 *   각 테이블 타입에서 Pick 으로 고르면 원본 타입이 바뀔 때 함께 바뀌어 어긋나지 않는다.
 *   role 을 붙여 유니온으로 묶으면, `user.role === 'MEMBER'` 를 확인한 뒤에는 TypeScript 가 memberId 가 있다고 확정한다
 *   (구분된 유니온, discriminated union). guardRole('MEMBER') 를 통과한 화면이 memberId 를 바로 쓸 수 있는 이유다.
 *
 * ■ 원본 전부(IMember)를 들고 다니지 않는 이유
 *   이 값은 authStore 를 통해 localStorage 에 저장된다. 연락처 · 연체 건수처럼 자주 바뀌는 값은 금방 옛 값이 되므로
 *   로그인 중 바뀌지 않고 화면 어디서나 필요한 값(누구인지 · 어떤 역할인지)만 두고, 나머지는 필요할 때 API 로 조회한다.
 *
 * ■ 로그인 아이디(loginId)는 담지 않는다
 *   로그인 아이디는 로그인 정보의 절반이라, 브라우저 저장소(localStorage)처럼 스크립트로 읽을 수 있는 곳에 남기지 않는다.
 *   로그인 뒤에는 시스템 번호(memberId · adminId)와 역할(role)로만 사용자를 다룬다 — loginId 는 로그인 요청에서 계정을 찾는 데에만 쓴다.
 */

/** 로그인한 관리자 */
export type IAuthAdmin = Pick<IAdmin, 'adminId' | 'adminCode' | 'name'> & {
	role: 'ADMIN';
};

/** 로그인한 회원 */
export type IAuthMember = Pick<IMember, 'memberId' | 'memberCode' | 'name'> & {
	role: 'MEMBER';
};

/** 로그인한 사용자 — role 로 관리자 / 회원이 구분된다 */
export type IAuthUser = IAuthAdmin | IAuthMember;

/**
 * 로그인 요청 — 관리자 · 회원 모두 아이디 · 비밀번호만 보낸다.
 * 역할은 보내지 않는다: 어느 로그인 API 로 보냈는지(진입점)가 곧 역할이다.
 */
export interface ILoginRequest {
	loginId: string;
	password: string;
}

/**
 * 로그인 응답
 * @generic T 로그인한 사용자 타입 (관리자 로그인이면 IAuthAdmin, 회원 로그인이면 IAuthMember)
 */
export interface ILoginResponse<T extends IAuthUser = IAuthUser> {
	/** 이후 모든 요청의 Authorization 헤더에 붙는 토큰 */
	token: string;
	user: T;
}
