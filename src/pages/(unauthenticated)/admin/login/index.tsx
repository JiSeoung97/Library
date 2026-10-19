import { HOME_PATH_BY_ROLE } from '@/consts/common/auth';
import LoginCard from '@/pages/(unauthenticated)/-components/LoginCard';
import services from '@/services/services';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

/**
 * 관리자 로그인 — 사서의 진입점. 관리자 테이블의 계정만 로그인할 수 있다.
 * 진입점을 회원과 나눠 두면 운영에서 이 주소만 따로 막거나(사내망 · IP 제한) 감시할 수 있다.
 */
const Component = () => {
	const navigate = useNavigate();
	const { authService } = services;
	const { mutate: login, isPending } = authService.usePostAdminLogin();

	return (
		<LoginCard
			Icon={AdminPanelSettingsIcon}
			title='도서관 관리자 로그인'
			description='도서 · 회원 · 대출 관리'
			submitLabel='관리자 로그인'
			demoAccount='데모 계정 — admin / admin1234'
			isPending={isPending}
			onSubmit={values =>
				login(
					{ data: values },
					{ onSuccess: () => navigate({ to: HOME_PATH_BY_ROLE.ADMIN }) },
				)
			}
			switchLink={{ to: '/login', label: '← 회원 로그인' }}
		/>
	);
};

export const Route = createFileRoute('/(unauthenticated)/admin/login/')({
	// 회원 로그인과 같은 이유로 들어오면 먼저 로그아웃한다
	beforeLoad: ({ preload }) => {
		if (!preload) services.authService.logout();
	},
	component: Component,
});
