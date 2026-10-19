import { LOGIN_PATH_BY_ROLE } from '@/consts/common/auth';
import services from '@/services/services';
import { useAuthStore } from '@/stores/auth/authStore';
import { cn } from '@/utils/common/cn';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton, Tooltip, Typography } from '@mui/material';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';

const ADMIN_MENUS = [
	{ to: '/dashboard', label: '대시보드', Icon: DashboardIcon },
	{ to: '/book', label: '도서 관리', Icon: MenuBookIcon },
	{ to: '/member', label: '회원 관리', Icon: PeopleIcon },
	{ to: '/loanStatus', label: '대출 / 반납 현황', Icon: AssignmentReturnIcon },
	{ to: '/extension', label: '연장 승인', Icon: FactCheckIcon },
] as const;

const MEMBER_MENUS = [
	{ to: '/bookSearch', label: '도서 검색', Icon: SearchIcon },
	{ to: '/myLoan', label: '내 대출 현황', Icon: LibraryBooksIcon },
	{ to: '/myInfo', label: '내 정보', Icon: PersonIcon },
] as const;

const Sidebar = () => {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: state => state.location.pathname });
	const user = useAuthStore(state => state.user);
	const { authService } = services;
	const isAdmin = user?.role === 'ADMIN';
	const menus = isAdmin ? ADMIN_MENUS : MEMBER_MENUS;

	// 방금까지 쓰던 역할의 로그인 화면으로 돌려보낸다 — 관리자는 /admin/login, 회원은 /login
	const handleLogout = () => {
		const loginPath = LOGIN_PATH_BY_ROLE[user?.role ?? 'MEMBER'];
		authService.logout();
		navigate({ to: loginPath });
	};

	return (
		<aside className='flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white'>
			<div className='flex flex-row items-center gap-3 p-5'>
				<div className='flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white'>
					<LocalLibraryIcon fontSize='small' />
				</div>
				<div className='leading-tight'>
					<Typography className='text-[0.95rem] font-bold text-gray-900'>
						도서관 관리
					</Typography>
					<Typography className='text-xs text-gray-400'>Library System</Typography>
				</div>
			</div>

			<nav className='flex flex-1 flex-col gap-1 overflow-auto px-3 py-2'>
				<Typography className='px-3 pb-1 text-[0.7rem] font-semibold tracking-wider text-gray-400'>
					{isAdmin ? '관리자 메뉴' : '회원 메뉴'}
				</Typography>
				{menus.map(({ to, label, Icon }) => {
					// startsWith 만 쓰면 '/book' 메뉴가 '/bookSearch' 에서도 켜지는 식으로 겹치므로 경로 구분자까지 확인한다
					const isActive = pathname === to || pathname.startsWith(`${to}/`);

					return (
						<Link
							key={to}
							to={to}
							className={cn(
								'flex flex-row items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
								{
									'bg-blue-50 font-semibold text-blue-700': isActive,
									'text-gray-600 hover:bg-gray-100 hover:text-gray-900':
										!isActive,
								},
							)}
						>
							<Icon fontSize='small' />
							{label}
						</Link>
					);
				})}
			</nav>

			<div className='m-3 flex flex-row items-center gap-3 rounded-xl bg-gray-50 p-3'>
				<div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700'>
					{user?.name.slice(0, 1)}
				</div>
				<div className='min-w-0 flex-1 leading-tight'>
					<Typography className='truncate text-sm font-semibold text-gray-900'>
						{user?.name}
					</Typography>
					<Typography className='text-xs text-gray-500'>
						{isAdmin ? '관리자' : '회원'}
					</Typography>
				</div>
				<Tooltip title='로그아웃'>
					<IconButton size='small' aria-label='로그아웃' onClick={handleLogout}>
						<LogoutIcon fontSize='small' />
					</IconButton>
				</Tooltip>
			</div>
		</aside>
	);
};

export default Sidebar;
