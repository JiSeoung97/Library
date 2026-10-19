import type HttpClient from '@/networks/httpClient';
import BaseRepository from '@/repositories/common/baseRepository';
import type { IAuthAdmin, IAuthMember, ILoginRequest, ILoginResponse } from '@/types/auth/auth';
import type { IRequestBody, IResponseBody } from '@/types/common/repository';

/**
 * 인증 API — 회원 로그인과 관리자 로그인, 두 진입점이 있다.
 * 관리자와 회원은 테이블이 달라 API 도 나눈다 — 어느 API 로 보냈는지가 곧 역할이라 요청에 역할을 담지 않는다.
 * 로그아웃은 서버 요청 없이 클라이언트 상태(authStore · 쿼리 캐시)를 비우는 일이라 AuthService 가 직접 한다.
 */
export default class AuthRepository extends BaseRepository {
	constructor(private readonly httpClient: HttpClient) {
		super('/api/auth');
	}

	/** 회원 로그인 — 회원 테이블에서 아이디 · 비밀번호를 확인하고 토큰과 회원 정보를 받는다 */
	public postLogin = (body: IRequestBody<ILoginRequest>) =>
		this.httpClient.post<typeof body, IResponseBody<ILoginResponse<IAuthMember>>>(
			`${this.path}/login`,
			body,
		);

	/** 관리자 로그인 — 관리자 테이블에서 아이디 · 비밀번호를 확인하고 토큰과 관리자 정보를 받는다 */
	public postAdminLogin = (body: IRequestBody<ILoginRequest>) =>
		this.httpClient.post<typeof body, IResponseBody<ILoginResponse<IAuthAdmin>>>(
			`${this.path}/admin/login`,
			body,
		);
}
