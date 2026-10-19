import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface IProps {
	title: string;
	/** 제목 오른쪽 버튼 영역 (정보 수정 등 화면 전체에 대한 동작) */
	actions?: ReactNode;
}

/**
 * 모든 화면 맨 위의 제목 카드 — 화면마다 제목 크기 · 여백이 달라지지 않도록 한 곳에서 그린다.
 * 검색 카드 · 표 카드와 같은 흰 카드(테두리 · 모서리 · 좌우 여백 px-5)를 써서 배경과 구획을 나눈다.
 * 아래 카드와의 간격은 여기서 주지 않는다 — 페이지 컨테이너(route.tsx)의 gap-4 가 맡는다.
 */
const PageHeader = ({ title, actions }: IProps) => (
	// 높이를 고정한다(h-16) — 오른쪽에 버튼이 있는 화면과 없는 화면의 제목 카드 높이가 달라지지 않게
	<header className='flex h-16 shrink-0 flex-row items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5'>
		<Typography component='h1' className='text-xl font-bold tracking-tight text-gray-900'>
			{title}
		</Typography>
		{actions && <div className='flex flex-row items-center gap-2'>{actions}</div>}
	</header>
);

export default PageHeader;
