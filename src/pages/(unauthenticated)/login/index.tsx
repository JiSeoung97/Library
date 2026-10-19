import { HOME_PATH_BY_ROLE } from '@/consts/common/auth';
import LoginCard from '@/pages/(unauthenticated)/-components/LoginCard';
import services from '@/services/services';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

/**
 * 회원 로그인 — 도서관 이용자의 진입점. 회원 테이블의 계정만 로그인할 수 있다.
 * 관리자 계정은 별도 테이블이라 여기서 로그인하면 "아이디 또는 비밀번호가 올바르지 않습니다"가 된다.
 */
const Component = () => {
	const navigate = useNavigate();
	const { authService } = services;
	const { mutate: login, isPending } = authService.usePostLogin();

	return (
		<LoginCard
			Icon={LocalLibraryIcon}
			title='도서관 회원 로그인'
			description='도서 검색 · 내 대출 현황 · 연장 신청'
			submitLabel='로그인'
			demoAccount='데모 계정 — member / member1234'
			isPending={isPending}
			// 쓰기 훅은 항상 { data } 로 부른다. 실패(success:false)는 공용 오류 다이얼로그가 안내한다
			onSubmit={values =>
				login(
					{ data: values },
					{ onSuccess: () => navigate({ to: HOME_PATH_BY_ROLE.MEMBER }) },
				)
			}
			switchLink={{ to: '/admin/login', label: '관리자 로그인 →' }}
		/>
	);
};

export const Route = createFileRoute('/(unauthenticated)/login/')({
	// 로그인 화면 = 로그아웃 상태 — 이전 계정의 토큰·쿼리 캐시가 남아 다른 계정 로그인에 섞이지 않게 한다.
	// 링크 hover 로 도는 preload(defaultPreload: 'intent')에서는 로그아웃하지 않는다
	beforeLoad: ({ preload }) => {
		if (!preload) services.authService.logout();
	},
	component: Component,
});
