import { LOGIN_PATH_BY_ROLE } from '@/consts/common/auth';
import { useAuthStore } from '@/stores/auth/authStore';
import { redirect } from '@tanstack/react-router';

/**
 * 로그인 가드 — "로그인했는가"만 확인한다. 인증 레이아웃((authenticated)/route.tsx)의 beforeLoad 에 한 번 걸려 있다.
 *
 * beforeLoad 는 화면을 그리기 전에 실행된다. 여기서 redirect 를 throw 하면 화면이 그려지지 않고 바로 이동하므로,
 * 로그인하지 않은 사용자에게 보호된 화면이 잠깐이라도 보이지 않는다.
 *
 * 로그인하지 않았으면 회원 로그인(/login)으로 보낸다 — 어느 역할의 화면인지는 이 단계에서 알 수 없어 기본 진입점을 쓴다.
 *
 * 이 가드는 사용자 경험을 위한 것이다 — 실제 권한 검증은 서버가 토큰으로 해야 한다.
 */
export const guardAuth = () => {
	// 컴포넌트 밖이라 훅(useAuthStore)을 쓸 수 없다 → getState() 로 현재 값을 읽는다
	const { user } = useAuthStore.getState();
	if (!user) throw redirect({ to: LOGIN_PATH_BY_ROLE.MEMBER });
	return { user };
};
