import Sidebar from '@/pages/(authenticated)/-components/Sidebar';
import { guardAuth } from '@/pages/-guards/guardAuth';
import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * 로그인한 뒤의 모든 화면이 들어가는 틀 — 왼쪽 사이드바 + 오른쪽 본문.
 *   한 화면은 위에서부터 [제목 카드] → [검색 카드] → [표 카드] 로 쌓이고, 마지막 표가 남은 높이를 채운다.
 */
const Component = () => (
	<div className='flex h-screen bg-gray-50'>
		<Sidebar />
		{/* scrollbar-gutter-stable — 스크롤바 자리를 항상 비워 둔다. 재조회 중 잠깐 높이가 바뀌어 스크롤바가 생겼다 없어질 때
		    본문 폭이 같이 줄었다 늘어나며 화면이 흔들리는 것을 막는다 */}
		<main className='flex-1 scrollbar-gutter-stable overflow-auto p-4'>
			{/* flex-col + gap-4 — 자식(각 화면의 카드들)이 세로로 쌓이며 같은 간격을 갖는다 */}
			<div className='mx-auto flex h-full flex-col gap-4'>
				<Outlet />
			</div>
		</main>
	</div>
);

export const Route = createFileRoute('/(authenticated)')({
	// 이 아래 모든 화면은 로그인이 필요하다 — 로그인하지 않았으면 /login 으로 보낸다.
	// 역할(관리자/회원) 확인은 각 화면의 guardRole 이 한다
	beforeLoad: guardAuth,
	component: Component,
});
