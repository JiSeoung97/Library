import type { IAuthUser } from '@/types/auth/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IAuthState {
	/** 로그인한 사용자 — 로그인하지 않았으면 null */
	user: IAuthUser | null;
	/** API 요청의 Authorization 헤더에 붙일 토큰 */
	token: string | null;
	login: (user: IAuthUser, token: string) => void;
	logout: () => void;
}

/**
 * 로그인 상태 저장소 (Zustand) — "지금 누가 로그인했는가" 한 가지만 담는다.
 *
 * ■ 왜 TanStack Query 가 아니라 Zustand 인가
 *   도서 · 회원 · 대출처럼 서버에서 오는 데이터는 쿼리 캐시가 관리한다.
 *   로그인 상태는 서버 데이터의 사본이 아니라 "이 브라우저의 상태"라서 클라이언트 상태 저장소에 둔다.
 *
 * ■ persist — localStorage('library:auth')에 저장해 새로고침해도 로그인이 유지된다
 *
 * ■ 읽는 방법 두 가지
 *   - 컴포넌트: `useAuthStore(state => state.user)` — 값이 바뀌면 다시 그려진다 (예: 사이드바)
 *   - 컴포넌트 밖(라우트 가드 · 요청 인터셉터): `useAuthStore.getState()` — 그 순간의 값만 읽는다
 */
export const useAuthStore = create<IAuthState>()(
	persist(
		set => ({
			user: null,
			token: null,
			login: (user, token) => set({ user, token }),
			logout: () => set({ user: null, token: null }),
		}),
		{ name: 'library:auth' },
	),
);
