import { cn } from '@/utils/common/cn';
import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface IProps {
	title?: string;
	/** 제목 오른쪽 영역 */
	actions?: ReactNode;
	className?: string;
	children: ReactNode;
}

/**
 * 흰 배경 카드 — 표 · 검색 툴바와 같은 테두리 · 모서리 · 안쪽 여백(px-5 py-4)으로 화면 안의 구획을 나눈다.
 * 다른 카드와의 간격은 여기서 주지 않는다 — 페이지 컨테이너(route.tsx)의 gap-4 가 맡는다.
 */
const BoxCard = ({ title, actions, className, children }: IProps) => (
	<section
		className={cn(
			'flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4',
			className,
		)}
	>
		{(title || actions) && (
			<header className='flex flex-row items-center justify-between gap-4'>
				{title && (
					<Typography className='text-[0.95rem] font-semibold text-gray-800'>
						{title}
					</Typography>
				)}
				{actions}
			</header>
		)}
		{children}
	</section>
);

export default BoxCard;
