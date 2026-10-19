import { HOME_PATH_BY_ROLE, LOGIN_PATH_BY_ROLE } from '@/consts/common/auth';
import { useAuthStore } from '@/stores/auth/authStore';
import type { IAuthUser } from '@/types/auth/auth';
import type { TRole } from '@/types/common/repository';
import { redirect } from '@tanstack/react-router';

/** role 이 R 인 로그인 사용자 — 'MEMBER' 면 IAuthMember, 'ADMIN' 이면 IAuthAdmin */
type TAuthUserOf<R extends TRole> = Extract<IAuthUser, { role: R }>;

// 타입 판별 함수 — true 를 돌려주면 TypeScript 가 user 를 그 역할의 타입으로 좁힌다
const hasRole = <R extends TRole>(user: IAuthUser, role: R): user is TAuthUserOf<R> =>
	user.role === role;

/**
 * 역할 가드 — "이 화면에 들어올 수 있는 역할인가"를 확인한다. 각 화면의 beforeLoad 에 `guardRole('ADMIN')` 처럼 건다.
 *
 * ■ 함수를 돌려주는 함수(커링)인 이유
 *   beforeLoad 에는 "함수"를 넘겨야 한다. 역할만 받아 가드 함수를 만들어 주면 화면마다 한 줄로 쓸 수 있다.
 *
 * ■ 역할이 다르면 오류 화면이 아니라 "자기 첫 화면"으로 보낸다
 *   회원이 주소창에 관리자 화면 주소를 직접 입력해도 조용히 도서 검색으로 돌아간다.
 *
 * ■ 돌려주는 user 의 타입이 역할에 맞게 좁혀진다
 *   guardRole('MEMBER') 를 통과하면 user 는 IAuthMember 라 memberId 가 반드시 있다.
 *   돌려준 값은 라우트 context 에 들어가고, 화면은 `Route.useRouteContext().user.memberId` 를 null 처리 없이 쓴다.
 *   (부모 guardAuth 가 확인한 로그인 여부를 여기서 또 확인하는 것도 이 좁히기를 위해서다)
 */
export const guardRole =
	<R extends TRole>(role: R) =>
	(): { user: TAuthUserOf<R> } => {
		const { user } = useAuthStore.getState();
		if (!user) throw redirect({ to: LOGIN_PATH_BY_ROLE[role] });
		if (!hasRole(user, role)) throw redirect({ to: HOME_PATH_BY_ROLE[user.role] });
		return { user };
	};
