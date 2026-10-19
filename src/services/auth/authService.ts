import { queryClient } from '@/contexts/QueryProvider';
import type AuthRepository from '@/repositories/auth/authRepository';
import BaseService from '@/services/common/baseService';
import { useAuthStore } from '@/stores/auth/authStore';
import type { ILoginRequest, ILoginResponse } from '@/types/auth/auth';
import type { IRequestBody } from '@/types/common/repository';
import { useMutation } from '@tanstack/react-query';

/**
 * 인증 — 로그인 요청과, 로그인 상태(authStore)를 읽고 비우는 일을 맡는다.
 *
 * 로그인 흐름 요약:
 * 1. 회원 화면(/login)은 `usePostLogin`, 관리자 화면(/admin/login)은 `usePostAdminLogin` 의 mutate({ data }) 를 부른다
 * 2. 서버가 { token, user } 를 돌려준다 (user.role 로 관리자 / 회원이 구분된다)
 * 3. onSuccess 에서 authStore 에 저장한다 (persist 라 localStorage 에도 남아 새로고침해도 유지된다)
 * 4. 이후 모든 요청은 HttpClient 의 요청 인터셉터가 `getToken()` 으로 토큰을 꺼내 Authorization 헤더에 붙인다
 *
 * getToken · logout 은 서버 요청이 아니라 저장소를 읽고 쓰는 일이라 훅이 아닌 일반 메서드다
 * (훅이 아닌 메서드에는 `use` 접두어를 붙이지 않는다).
 */
export default class AuthService extends BaseService {
	constructor(private readonly authRepository: AuthRepository) {
		super();
	}

	/** 현재 로그인 토큰 — HttpClient 요청 인터셉터가 요청마다 부른다 (React 밖이라 getState 로 읽는다) */
	public getToken = () => useAuthStore.getState().token;

	/**
	 * 로그아웃 — 로그인 정보와 쿼리 캐시를 함께 비운다.
	 * 캐시까지 비우는 이유: 같은 브라우저에서 다른 계정으로 로그인했을 때 이전 사용자의 데이터(내 대출 · 내 정보 등)가 잠깐 보이지 않게 한다.
	 */
	public logout = () => {
		useAuthStore.getState().logout();
		queryClient.clear();
	};

	// 두 로그인의 성공 처리는 같다 — 받은 사용자 · 토큰을 저장한다
	private saveLogin = ({ data }: { data: ILoginResponse }) => {
		useAuthStore.getState().login(data.user, data.token);
	};

	/** 회원 로그인 — 호출: `mutate({ data: { loginId, password } })` */
	public usePostLogin = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<ILoginRequest>, 'data'>) =>
				this.authRepository.postLogin({ data }),
			onSuccess: this.saveLogin,
		});

	/** 관리자 로그인 — 호출: `mutate({ data: { loginId, password } })` */
	public usePostAdminLogin = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<ILoginRequest>, 'data'>) =>
				this.authRepository.postAdminLogin({ data }),
			onSuccess: this.saveLogin,
		});
}
